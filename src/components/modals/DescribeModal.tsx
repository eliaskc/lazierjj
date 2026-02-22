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

	const labelColor = (field: "subject" | "body") =>
		focusedField() === field ? colors().text : colors().textMuted

	return (
		<box flexDirection="column" gap={1}>
			<box flexDirection="column" gap={1}>
				<text fg={labelColor("subject")}>
					Subject{" "}
					<span style={{ fg: colors().textMuted }}>[{charCount()}]</span>
				</text>
				<input
					ref={(r) => {
						subjectRef = r
					}}
					value={props.initialSubject}
					onContentChange={() => {
						if (subjectRef) setSubject(subjectRef.plainText)
					}}
					onSubmit={handleSave}
					cursorColor={colors().primary}
					textColor={colors().text}
					focusedTextColor={colors().text}
					focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
					width="100%"
				/>
			</box>

			<box flexDirection="column" flexGrow={1} gap={1}>
				<text fg={labelColor("body")}>Body</text>
				<box
					backgroundColor={colors().backgroundDialog}
					padding={1}
					height={10}
				>
					<textarea
						ref={(r) => {
							bodyRef = r
						}}
						initialValue={props.initialBody}
						onContentChange={() => {
							if (bodyRef) setBody(bodyRef.plainText)
						}}
						cursorColor={colors().primary}
						textColor={colors().text}
						focusedTextColor={colors().text}
						focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
						flexGrow={1}
					/>
				</box>
			</box>
		</box>
	)
}
