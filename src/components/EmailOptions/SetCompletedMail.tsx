import { History } from 'history'
import { UpdateMetaListLabel } from '../../Store/metaListSlice'
import { convertArrayToString } from '../../utils'
import { LocationObjectType } from '../types/globalTypes'

interface SetCompletedMailProps {
  messageId: string
  history: History
  labelIds: string[]
  dispatch: any
  location: LocationObjectType
}

const SetCompletedMail = (props: SetCompletedMailProps) => {
  const { messageId, history, labelIds, dispatch, location } = props
  const labelURL = labelIds && convertArrayToString(labelIds)

  const CompletedAction = () => {
    const request = {
      removeLabelIds: labelIds,
    }
    dispatch(UpdateMetaListLabel({ messageId, request, history, location, labelIds }))
  }

  return CompletedAction()
}

export default SetCompletedMail
