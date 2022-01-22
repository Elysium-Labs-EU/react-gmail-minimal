import React, { useEffect, useState } from 'react'
import isEmpty from 'lodash/isEmpty'
import { selectComposeEmail, TrackComposeEmail } from '../../Store/composeSlice'
import useDebounce from '../../Hooks/useDebounce'
import * as local from '../../constants/composeEmailConstants'
import emailValidation from '../../utils/emailValidation'
import { CreateUpdateDraft, selectDraftDetails } from '../../Store/draftsSlice'
import { selectCurrentMessage } from '../../Store/emailDetailSlice'
import { useAppDispatch, useAppSelector } from '../../Store/hooks'
import ComposeEmailView from './ComposeEmailView'
import { Contact } from '../../Store/contactsTypes'
import convertToContact from '../../utils/convertToContact'

// Props are coming from MessageOverview
interface IComposeEmailProps {
  isReplying?: boolean
  isReplyingListener?: Function
  to?: Contact | null
  bcc?: Contact | null
  cc?: Contact | null
  subject?: string
  threadId?: string
}

const ComposeEmailContainer = ({
  isReplying,
  isReplyingListener,
  to,
  bcc,
  cc,
  subject,
  threadId,
}: IComposeEmailProps) => {
  const currentMessage = useAppSelector(selectCurrentMessage)
  const composeEmail = useAppSelector(selectComposeEmail)
  const draftDetails = useAppSelector(selectDraftDetails)
  const [toValue, setToValue] = useState<Contact[]>([])
  const debouncedToValue = useDebounce(toValue, 500)
  const [inputToValue, setInputToValue] = useState<string | number>('')
  const [showCC, setShowCC] = useState<boolean>(false)
  const [ccValue, setCCValue] = useState<Contact[]>([])
  const debouncedCCValue = useDebounce(ccValue, 500)
  const [inputCCValue, setInputCCValue] = useState<string | number>('')
  const [showBCC, setShowBCC] = useState<boolean>(false)
  const [bccValue, setBCCValue] = useState<Contact[]>([])
  const debouncedBCCValue = useDebounce(bccValue, 500)
  const [inputBCCValue, setInputBCCValue] = useState<string | number>('')
  const [subjectValue, setSubjectValue] = useState('')
  const debouncedSubjectValue = useDebounce(subjectValue, 500)
  const [bodyValue, setBodyValue] = useState('')
  const debouncedBodyValue = useDebounce(bodyValue, 500)
  const [toError, setToError] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    let mounted = true
    if (!isEmpty(composeEmail)) {
      mounted && dispatch(CreateUpdateDraft())
    }
    return () => {
      mounted = false
    }
  }, [composeEmail])

  useEffect(() => {
    let mounted = true
    if (!isEmpty(draftDetails) && mounted) {
      setSaveSuccess(true)
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, 2500)
      return () => {
        clearTimeout(timer)
      }
    }
    return () => {
      mounted = false
    }
  }, [draftDetails])

  const handleChangeRecipients = (recipientListRaw: any) => {
    const recipientList = {
      fieldId: recipientListRaw.fieldId,
      newValue: recipientListRaw.newValue.map(
        (item: string | Contact) => typeof (item) === 'string'
          ? { name: item, emailAddress: item } : item)
    }
    switch (recipientList.fieldId) {
      case local.TO: {
        const validation = emailValidation(recipientList.newValue)
        if (validation) {
          setToValue(recipientList.newValue)
        }
        if (!validation) {
          setToError(true)
        }
        break
      }
      case local.CC: {
        const validation = emailValidation(recipientList.newValue)
        if (validation) {
          setCCValue(recipientList.newValue)
        }
        if (!validation) {
          setToError(true)
        }
        break
      }
      case local.BCC: {
        const validation = emailValidation(recipientList.newValue)
        if (validation) {
          setBCCValue(recipientList.newValue)
        }
        if (!validation) {
          setToError(true)
        }
        break
      }
      default:
    }
  }

  const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubjectValue(e.target.value)
  }

  const handleDelete = (selectedOption: any) => {
    const { option, fieldId } = selectedOption
    switch (fieldId) {
      case local.TO: {
        setToValue(toValue.filter(item => item !== option))
        break
      }
      case local.CC: {
        setCCValue(ccValue.filter(item => item !== option))
        break
      }
      case local.BCC: {
        setBCCValue(bccValue.filter(item => item !== option))
        break
      }
      default: {
        break
      }
    }
  }

  useEffect(() => {
    let mounted = true
    if (debouncedToValue && debouncedToValue.length > 0) {
      if (emailValidation(debouncedToValue)) {
        const updateEventObject = { id: local.TO, value: debouncedToValue }
        mounted && dispatch(TrackComposeEmail(updateEventObject))
      }
    }
    return () => {
      mounted = false
    }
  }, [debouncedToValue])

  useEffect(() => {
    let mounted = true
    if (debouncedBCCValue && debouncedBCCValue.length > 0) {
      if (emailValidation(debouncedBCCValue)) {
        const updateEventObject = { id: local.BCC, value: debouncedBCCValue }
        mounted && dispatch(TrackComposeEmail(updateEventObject))
      }
    }
    return () => {
      mounted = false
    }
  }, [debouncedBCCValue])

  useEffect(() => {
    let mounted = true
    if (debouncedCCValue && debouncedCCValue.length > 0) {
      if (emailValidation(debouncedCCValue)) {
        const updateEventObject = { id: local.CC, value: debouncedCCValue }
        mounted && dispatch(TrackComposeEmail(updateEventObject))
      }
    }
    return () => {
      mounted = false
    }
  }, [debouncedCCValue])

  useEffect(() => {
    let mounted = true
    if (debouncedSubjectValue) {
      const updateEventObject = {
        id: local.SUBJECT,
        value: debouncedSubjectValue,
      }
      mounted && dispatch(TrackComposeEmail(updateEventObject))
    }
    return () => {
      mounted = false
    }
  }, [debouncedSubjectValue])

  useEffect(() => {
    let mounted = true
    if (debouncedBodyValue) {
      const updateEventObject = { id: local.BODY, value: debouncedBodyValue }
      mounted && dispatch(TrackComposeEmail(updateEventObject))
    }
    return () => {
      mounted = false
    }
  }, [debouncedBodyValue])

  // Set the form values
  useEffect(() => {
    let mounted = true
    if (mounted) {
      if (!isEmpty(composeEmail)) {
        setToValue(Array(composeEmail.to).map((item) => convertToContact(item)))
        if (composeEmail.cc && composeEmail.cc.length > 0) {
          setShowCC(true)
          setCCValue(Array(composeEmail.cc).map((item) => convertToContact(item)))
        }
        if (composeEmail.bcc && composeEmail.bcc.length > 0) {
          setShowBCC(true)
          setBCCValue(Array(composeEmail.bcc).map((item) => convertToContact(item)))
        }
        setSubjectValue(composeEmail.subject)
        setBodyValue(composeEmail.body)
      }
      // Form values coming from a new reply via MessageOverview
      if (to) setToValue([to])
      if (cc) setCCValue([cc])
      if (bcc) setBCCValue([bcc])
      if (subject) setSubjectValue(subject)
    }
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (currentMessage && currentMessage.id) {
      const updateEventObject = {
        id: 'id',
        value: currentMessage.id,
      }
      mounted && dispatch(TrackComposeEmail(updateEventObject))
    }
    return () => {
      mounted = false
    }
  }, [currentMessage])

  useEffect(() => {
    let mounted = true
    if (threadId) {
      const updateEventObject = {
        id: 'threadId',
        value: threadId,
      }
      mounted && dispatch(TrackComposeEmail(updateEventObject))
    }
    return () => {
      mounted = false
    }
  }, [threadId])

  return (
    <ComposeEmailView
      bccValue={bccValue}
      bodyValue={bodyValue}
      ccValue={ccValue}
      draftDetails={draftDetails}
      handleChangeRecipients={handleChangeRecipients}
      handleChangeSubject={handleChangeSubject}
      handleDelete={handleDelete}
      inputToValue={inputToValue}
      inputCCValue={inputCCValue}
      inputBCCValue={inputBCCValue}
      isReplying={isReplying}
      isReplyingListener={isReplyingListener}
      toError={toError}
      toValue={toValue}
      setToError={setToError}
      saveSuccess={saveSuccess}
      showCC={showCC}
      showBCC={showBCC}
      setShowBCC={setShowBCC}
      setShowCC={setShowCC}
      setInputToValue={setInputToValue}
      setInputCCValue={setInputCCValue}
      setInputBCCValue={setInputBCCValue}
      subjectValue={subjectValue}
    />
  )
}

export default ComposeEmailContainer

ComposeEmailContainer.defaultProps = {
  isReplying: false,
  isReplyingListener: null,
  to: null,
  bcc: null,
  cc: null,
  subject: null,
  threadId: null,
}
