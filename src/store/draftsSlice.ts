/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import isEmpty from 'lodash/isEmpty'
import { push } from 'redux-first-history'
import draftApi from '../data/draftApi'
import { closeMail, setIsProcessing, setSystemStatusUpdate } from './utilsSlice'
import { setCurrentEmail, setIsReplying } from './emailDetailSlice'
import type { AppThunk, RootState } from './store'
import {
  DraftDetails,
  DraftsState,
  EnhancedDraftDetails,
  OpenDraftEmailType,
  IDraftDetailObject,
} from './storeTypes/draftsTypes'
import {
  listRemoveItemDetail,
  listRemoveItemDetailBatch,
  listRemoveItemDetailDraft,
  setSelectedEmails,
} from './emailListSlice'
import * as global from '../constants/globalConstants'
import archiveMail from '../components/EmailOptions/ArchiveMail'
import messageApi from '../data/messageApi'
import getEmailListIndex from '../utils/getEmailListIndex'
import { IComposePayload } from './storeTypes/composeTypes'
import { prepareFormData } from '../utils/prepareMessage'

export const fetchDrafts = createAsyncThunk(
  'drafts/fetchDrafts',
  async (_, { signal }) => {
    const response = await draftApi(signal).getDrafts()
    return response
  }
)

const initialState: DraftsState = Object.freeze({
  draftList: [],
})

export const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    listRemoveDraftThread: (state, { payload }: PayloadAction<any>) => {
      const { threadId }: { threadId: string } = payload
      const copyCurrentDraftList = state.draftList
      const newDraftList: IDraftDetailObject[] = copyCurrentDraftList.filter(
        (item) => item.message.threadId !== threadId
      )
      state.draftList = newDraftList
    },
    listRemoveDraftMessage: (state, { payload }: PayloadAction<any>) => {
      const { messageId }: { messageId: string } = payload
      const copyCurrentDraftList = state.draftList
      const newDraftList: IDraftDetailObject[] = copyCurrentDraftList.filter(
        (item) => item.message.id !== messageId
      )
      state.draftList = newDraftList
    },
    listRemoveDraftBatch: (state, { payload }: PayloadAction<any>) => {
      const { threadIds }: { threadIds: string[] } = payload
      const copyCurrentDraftList = state.draftList

      const filterArray = () => {
        const filtered = copyCurrentDraftList.filter(
          (el) => threadIds.indexOf(el.message.threadId) === -1
        )
        return filtered
      }
      state.draftList = filterArray()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDrafts.fulfilled, (state, { payload }) => {
      // Only update the state whenever there is something.
      if (payload.resultSizeEstimate > 0) {
        state.draftList = payload.drafts
      }
    })
  },
})

export const {
  listRemoveDraftThread,
  listRemoveDraftMessage,
  listRemoveDraftBatch,
} = draftsSlice.actions

export const createUpdateDraft =
  ({
    composedEmail,
    localDraftDetails,
  }: {
    composedEmail: IComposePayload
    localDraftDetails: IDraftDetailObject | undefined
  }): AppThunk =>
  async (dispatch, getState) => {
    try {
      const { emailAddress, name } = getState().base.profile
      const formData = await prepareFormData({
        composedEmail,
        emailAddress,
        localDraftDetails,
        name,
      })

      const response = !localDraftDetails
        ? await draftApi().createDrafts(formData)
        : await draftApi().updateDrafts({ id: localDraftDetails?.id, formData })

      if (response && response?.status === 200) {
        // Remove the previous entry from Redux Emaillist. History will create a new one.
        dispatch(
          listRemoveItemDetailDraft({
            threadId: localDraftDetails?.message?.threadId,
          })
        )
        return response.data.data
      }
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Cannot create or update draft.',
        })
      )
      return null
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Cannot create or update draft.',
        })
      )
      return null
    }
  }

const pushDraftDetails =
  ({ draft, draft: { message } }: EnhancedDraftDetails): AppThunk =>
  async (dispatch, getState) => {
    try {
      if (draft?.id && message?.threadId) {
        dispatch(setCurrentEmail(message.threadId))
        if (!getState().labels.labelIds.includes(global.DRAFT_LABEL)) {
          dispatch(setIsReplying(true))
        } else {
          // From headers are not taken in account here - since we only allow for one account
          const loadEmail = {
            id: message?.id,
            threadId: message?.threadId,
            to: message?.payload?.headers?.to,
            cc: message?.payload?.headers?.cc,
            bcc: message?.payload?.headers?.bcc,
            subject: message?.payload?.headers?.subject,
            body: message?.payload?.body?.emailHTML,
            // Push the files as B64 objects to the state, to be decoded on the component. Files cannot be stored into Redux.
            files: message.payload?.files,
          }
          dispatch(push(`/compose/${draft.id}`, loadEmail))
        }
      } else {
        dispatch(push(`/compose/`))
      }
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Error setting up compose email.',
        })
      )
    }
  }

const loadDraftDetails = (draftDetails: DraftDetails): AppThunk => {
  const { draftId } = draftDetails
  return async (dispatch) => {
    try {
      const response = await draftApi().getDraftDetail(draftId)
      if (response?.status && response.status === 200) {
        dispatch(pushDraftDetails({ draft: response.data }))
      } else {
        dispatch(
          setSystemStatusUpdate({
            type: 'error',
            message: 'Error setting up compose email.',
          })
        )
      }
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Error setting up compose email.',
        })
      )
    }
  }
}

const ERROR_OPEN_DRAFT_EMAIL = 'Error setting up compose email.'
export const openDraftEmail =
  ({ messageId, id }: OpenDraftEmailType): AppThunk =>
  async (dispatch, getState) => {
    try {
      // If Draft list is empty, fetch it first.
      if (isEmpty(getState().drafts.draftList)) {
        const { payload } = await dispatch(fetchDrafts())
        if (payload?.drafts && payload.drafts.length > 0) {
          const { drafts }: { drafts: IDraftDetailObject[] } = payload
          const draftIdFilter = drafts.filter(
            (draft) => draft.message.id === messageId
          )
          const draftId = draftIdFilter[0].id
          if (!isEmpty(draftId)) {
            dispatch(loadDraftDetails({ draftId }))
          } else {
            dispatch(
              setSystemStatusUpdate({
                type: 'error',
                message: ERROR_OPEN_DRAFT_EMAIL,
              })
            )
          }
        } else {
          dispatch(
            setSystemStatusUpdate({
              type: 'error',
              message: ERROR_OPEN_DRAFT_EMAIL,
            })
          )
        }
      } else {
        const { draftList } = getState().drafts

        // Search the draftList on message.threadId to get the id. Use that Id to fetch all the details of the draft.
        const selectedEmail =
          draftList && messageId
            ? draftList.find((draft) => draft.message.id === messageId)
            : draftList.find((draft) => draft.message.threadId === id)

        if (selectedEmail) {
          const draftId = selectedEmail.id
          if (!isEmpty(draftId)) {
            dispatch(loadDraftDetails({ draftId }))
          } else {
            dispatch(
              setSystemStatusUpdate({
                type: 'error',
                message: ERROR_OPEN_DRAFT_EMAIL,
              })
            )
          }
        }
      }
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: ERROR_OPEN_DRAFT_EMAIL,
        })
      )
    }
  }

export const deleteDraftBatch = (): AppThunk => async (dispatch, getState) => {
  const { selectedEmails } = getState().email
  const { draftList } = getState().drafts
  dispatch(
    listRemoveItemDetailBatch({
      messageIds: selectedEmails,
    })
  )
  dispatch(setSelectedEmails([]))
  dispatch(listRemoveDraftBatch({ threadIds: selectedEmails }))
  for (let i = 0; selectedEmails.length > i; i += 1) {
    try {
      const draftObject =
        draftList.length > 0 &&
        draftList.find(
          (draft) => draft?.message?.threadId === selectedEmails[i]
        )
      if (
        typeof draftObject === 'object' &&
        !Array.isArray(draftObject) &&
        draftObject !== null
      ) {
        draftApi().deleteDraft(draftObject.id)
      }
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Error deleting draft.',
        })
      )
    }
  }
}

export const deleteDraft =
  (id: string): AppThunk =>
  async (dispatch, getState) => {
    const { coreStatus } = getState().emailDetail
    dispatch(setIsProcessing(true))
    try {
      await draftApi().deleteDraft(id)
    } catch (err) {
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Error deleting draft.',
        })
      )
    } finally {
      dispatch(setIsProcessing(false))
      // When in search mode, and the discard of the draft is complete, send a notification, since the searchList is a separate state that is not updated.
      if (coreStatus === global.CORE_STATUS_SEARCHING) {
        dispatch(
          setSystemStatusUpdate({
            type: 'info',
            message: 'Draft has been deleted',
          })
        )
      }
    }
  }

export const sendComposedEmail =
  ({
    composedEmail,
    localDraftDetails,
  }: {
    composedEmail: IComposePayload
    localDraftDetails: IDraftDetailObject | undefined
  }): AppThunk =>
  async (dispatch, getState) => {
    try {
      const { emailList } = getState().email
      // If the id is found on the draft details, send the draft email via the Google servers as a draft.
      if (localDraftDetails?.id) {
        const response = await draftApi().sendDraft({
          id: localDraftDetails?.id,
        })
        // When succesfully sending the email - the system removes the draft from the draft inbox, the draft list, and the thread's other inbox location.
        if (response?.status === 200) {
          const { labelIds } = getState().labels
          archiveMail({
            threadId: localDraftDetails?.message?.threadId,
            dispatch,
            labelIds,
          })
          const staticIndexActiveEmailList: number = getEmailListIndex({
            emailList,
            labelIds: [global.DRAFT_LABEL],
          })
          if (staticIndexActiveEmailList > -1)
            dispatch(
              listRemoveItemDetail({
                messageId: localDraftDetails?.message?.id,
                staticIndexActiveEmailList,
              })
            )

          dispatch(setCurrentEmail(''))
          dispatch(closeMail())
        } else {
          dispatch(
            setSystemStatusUpdate({
              type: 'error',
              message: 'Error sending email.',
            })
          )
        }
      }
      // If the id cannot be found on the draft details, send the email via the sendMessage function
      if (!localDraftDetails?.id) {
        const { emailAddress, name } = getState().base.profile
        const formData = await prepareFormData({
          composedEmail,
          emailAddress,
          localDraftDetails,
          name,
        })

        const response = await messageApi().sendMessage(formData)
        if (response?.status === 200) {
          dispatch(setCurrentEmail(''))
          dispatch(closeMail())
        } else {
          dispatch(
            setSystemStatusUpdate({
              type: 'error',
              message: 'Error sending email.',
            })
          )
        }
      }
    } catch (err) {
      console.error(err)
      dispatch(
        setSystemStatusUpdate({
          type: 'error',
          message: 'Error sending email.',
        })
      )
    }
  }

export const selectDraftList = (state: RootState) => state.drafts.draftList

export default draftsSlice.reducer
