import { useCallback } from 'react'
import { FiCornerUpLeft } from 'react-icons/fi'
import CustomButton from '../../Elements/Buttons/CustomButton'
import * as local from '../../../constants/emailDetailConstants'
import * as global from '../../../constants/globalConstants'
import { IEmailListThreadItem } from '../../../Store/storeTypes/emailListTypes'
import isReplyingListener from '../../EmailOptions/IsReplyingListener'
import { useAppDispatch, useAppSelector } from '../../../Store/hooks'
import useMultiKeyPress from '../../../Hooks/useMultiKeyPress'
import { selectInSearch } from '../../../Store/utilsSlice'
import modifierKey from '../../../utils/setModifierKey'

interface IEmailDetailOptions {
  threadDetail: IEmailListThreadItem
}
const actionKeys = [modifierKey, global.KEY_ENTER]

const ReplyOption = ({ threadDetail }: IEmailDetailOptions) => {
  const dispatch = useAppDispatch()
  const inSearch = useAppSelector(selectInSearch)

  const handleEvent = useCallback(() => {
    if (threadDetail.messages) {
      return isReplyingListener({
        messageIndex: threadDetail.messages.length - 1,
        dispatch,
      })
    }
    return null
  }, [threadDetail, dispatch])

  useMultiKeyPress(handleEvent, actionKeys, inSearch)

  return (
    <CustomButton
      icon={<FiCornerUpLeft />}
      label={local.BUTTON_REPLY}
      onClick={handleEvent}
      suppressed
    />
  )
}

export default ReplyOption
