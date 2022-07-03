import { resetDraftDetails } from '../../Store/draftsSlice'
import { setIsReplying } from '../../Store/emailDetailSlice'
import { openEmail } from '../../Store/utilsSlice'

interface IReplyOverview {
  id: string
  dispatch: Function
}

const ReplyOverview = ({ id, dispatch }: IReplyOverview) => {
  dispatch(resetDraftDetails())
  dispatch(setIsReplying(true))
  dispatch(openEmail({ id }))
}

export default ReplyOverview
