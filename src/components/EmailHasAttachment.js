import { FiPaperclip } from 'react-icons/fi'

const EmailAttachment = ({ hasAttachment }) => {
  // const CheckAttachment = () => {
  //   if (
  //     hasAttachment &&
  //     hasAttachment.filter((thread) => thread.payload.hasOwnProperty('parts'))
  //       .length > 0
  //   ) {
  //     let parts = hasAttachment.map((object) => object.payload.parts)
  //     console.log(parts)
  //     if (
  //       parts.map((object) => object[1].filename.length).filter((part) => part)
  //         .length > 0
  //     ) {
  //       return <FiPaperclip />
  //     } else {
  //       return null
  //     }
  //   } else {
  //     return null
  //   }
  // }

  // return <CheckAttachment />
  return null
}

export default EmailAttachment
