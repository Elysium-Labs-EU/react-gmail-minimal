import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  selectActiveEmailListIndex,
  selectEmailList,
  selectSelectedEmails,
  setSelectedEmails,
  updateEmailLabelBatch,
} from '../../../Store/emailListSlice'
import { useAppDispatch, useAppSelector } from '../../../Store/hooks'
import { selectLabelIds } from '../../../Store/labelsSlice'
import CustomButton from '../../Elements/Buttons/CustomButton'
import * as S from './SelectedOptionsStyles'
import * as draft from '../../../constants/draftConstants'
import * as global from '../../../constants/globalConstants'
import { deleteDraftBatch } from '../../../Store/draftsSlice'

const ARCHIVE_BUTTON_LABEL = 'Archive'
const DISCARD_BUTTON_LABEL = 'Discard'
const EMAILS_SELECTED_SINGLE = 'emails selected'
const EMAILS_SELECTED_PLURAL = 'email selected'

const SelectedOptions = () => {
  const labelIds = useAppSelector(selectLabelIds)
  const dispatch = useAppDispatch()
  const selectedEmails = useAppSelector(selectSelectedEmails)
  const location = useLocation()
  const activeEmailListIndex = useAppSelector(selectActiveEmailListIndex)
  const emailList = useAppSelector(selectEmailList)
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)

  useEffect(() => {
    if (location.pathname !== currentLocation) {
      setCurrentLocation(location.pathname)
    }
    if (currentLocation !== null && currentLocation !== location.pathname) {
      if (selectedEmails.length > 0) {
        dispatch(setSelectedEmails([]))
      }
    }
  }, [location])

  const handleCancel = useCallback(() => {
    dispatch(setSelectedEmails([]))
  }, [])

  const handleSelectAll = useCallback(() => {
    dispatch(
      setSelectedEmails(
        emailList[activeEmailListIndex].threads.map((thread) => ({
          id: thread.id,
          event: 'add',
        }))
      )
    )
  }, [activeEmailListIndex, emailList])

  const handleArchiveAll = useCallback(() => {
    const request = {
      removeLabelIds: [
        ...labelIds.filter((item) => item !== global.UNREAD_LABEL),
      ],
    }

    dispatch(updateEmailLabelBatch({ request }))
    dispatch(setSelectedEmails([]))
  }, [labelIds])

  const handleDiscardAll = useCallback(() => {
    dispatch(deleteDraftBatch())
  }, [labelIds])

  return (
    <S.Wrapper>
      <S.Inner>
        <CustomButton label="Cancel" onClick={handleCancel} />
        <CustomButton label="Select all" onClick={handleSelectAll} />
      </S.Inner>
      <S.Inner>
        <S.SelectedLabelsText>{`${selectedEmails.length} ${
          selectedEmails.length > 1
            ? EMAILS_SELECTED_SINGLE
            : EMAILS_SELECTED_PLURAL
        }`}</S.SelectedLabelsText>
        {!labelIds.includes(draft.DRAFT_LABEL) ? (
          <CustomButton
            label={ARCHIVE_BUTTON_LABEL}
            onClick={handleArchiveAll}
          />
        ) : (
          <CustomButton
            label={DISCARD_BUTTON_LABEL}
            onClick={handleDiscardAll}
          />
        )}
      </S.Inner>
    </S.Wrapper>
  )
}

export default SelectedOptions