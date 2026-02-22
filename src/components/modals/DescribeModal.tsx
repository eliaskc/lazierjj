import {
	type InputRenderable,
	RGBA,
	type TextareaRenderable,
} from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { createSignal, onMount } from "solid-js"
import { useDialog } from "../../context/dialog"
import { useTheme } from "../../context/theme"

interface DescribeModalProps {
	initialSubject: string
	initialBody: string
	onSave: (subject: string, body: string) => void
}

export function DescribeModal(props: DescribeModalProps) {
	const dialog = useDialog()
	const { colors } = useTheme()

	const [subject, setSubject] = createSignal(props.initialSubject)
	const [body, setBody] = createSignal(props.initialBody)
	const [focusedField, setFocusedField] = createSignal<"subject" | "body">(
		"subject",
	)

	let subjectRef: InputRenderable | undefined
	let bodyRef: TextareaRenderable | undefined

	const focusAtEnd = (
		ref: { focus(): void; gotoBufferEnd(): void } | undefined,
	) => {
		if (!ref) return
		ref.focus()
		ref.gotoBufferEnd()
	}

	onMount(() => {
		setTimeout(() => {
			subjectRef?.requestRender?.()
			focusAtEnd(subjectRef)
		}, 1)
	})

	const handleSave = () => {
		dialog.close()
		props.onSave(subject(), body())
	}

	useKeyboard((evt) => {
		if (evt.name === "tab") {
			evt.preventDefault()
			evt.stopPropagation()
			if (focusedField() === "subject") {
				setFocusedField("body")
				focusAtEnd(bodyRef)
			} else {
				setFocusedField("subject")
				focusAtEnd(subjectRef)
			}
		}
	})

	const charCount = () => subject().length

	return (
		<box flexDirection="column" gap={1}>
			<box flexDirection="row" width="100%">
				<input
					ref={(r) => {
						subjectRef = r
					}}
					value={props.initialSubject}
					placeholder="Subject"
					onContentChange={() => {
						if (subjectRef) setSubject(subjectRef.plainText)
					}}
					onSubmit={handleSave}
					cursorColor={colors().primary}
					textColor={colors().text}
					focusedTextColor={colors().text}
					focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
					flexGrow={1}
					flexShrink={1}
				/>
				<box width={5} flexShrink={0} paddingLeft={1}>
					<text fg={colors().textMuted}>{charCount()}</text>
				</box>
			</box>

			<textarea
				ref={(r) => {
					bodyRef = r
				}}
				initialValue={props.initialBody}
				placeholder="Body"
				onContentChange={() => {
					if (bodyRef) setBody(bodyRef.plainText)
				}}
				cursorColor={colors().primary}
				textColor={colors().text}
				focusedTextColor={colors().text}
				focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
				flexGrow={1}
				height={8}
			/>
		</box>
	)
}
