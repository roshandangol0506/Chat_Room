import { ScrollArea } from "@/components/ui/scroll-area"

type MessageListProps = {
  messages: string[]
  loginUser: { id: string; username: string; email: string } | null
}

export default function MessageList({ messages, loginUser }: MessageListProps) {
  return (
    <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-4">
        {messages.map((msg, index) => {
          // Determine if message is from current user (simple heuristic)
          const isCurrentUser = msg.includes(loginUser?.username || "")

          return (
            <div key={index} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-gray-200 dark:bg-gray-800"
                }`}
              >
                {msg}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

