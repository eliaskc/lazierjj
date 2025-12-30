import { describe, expect, test } from "bun:test"
import { parseBookmarkOutput } from "../../../src/commander/bookmarks"

describe("parseBookmarkOutput", () => {
	test("parses local bookmark", () => {
		const output = "main: abc123 def456 feat: add feature"
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({
			name: "main",
			changeId: "abc123",
			commitId: "def456",
			description: "feat: add feature",
			isLocal: true,
		})
	})

	test("parses remote bookmark", () => {
		const output = "  @origin: abc123 def456 feat: add feature"
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual({
			name: "origin",
			changeId: "abc123",
			commitId: "def456",
			description: "feat: add feature",
			isLocal: false,
			remote: "origin",
		})
	})

	test("parses local with remote bookmarks", () => {
		const output = `main: abc123 def456 feat: add feature
  @git: abc123 def456 feat: add feature
  @origin: abc123 def456 feat: add feature`
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(3)
		expect(result[0]?.isLocal).toBe(true)
		expect(result[0]?.name).toBe("main")
		expect(result[1]?.isLocal).toBe(false)
		expect(result[1]?.remote).toBe("git")
		expect(result[2]?.isLocal).toBe(false)
		expect(result[2]?.remote).toBe("origin")
	})

	test("parses multiple local bookmarks", () => {
		const output = `main: abc123 def456 main branch
feature/foo: ghi789 jkl012 working on foo
bugfix: mno345 pqr678 fix something`
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(3)
		expect(result[0]?.name).toBe("main")
		expect(result[1]?.name).toBe("feature/foo")
		expect(result[2]?.name).toBe("bugfix")
	})

	test("handles empty description", () => {
		const output = "main: abc123 def456"
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(1)
		expect(result[0]?.description).toBe("")
	})

	test("handles empty output", () => {
		const result = parseBookmarkOutput("")
		expect(result).toHaveLength(0)
	})

	test("handles output with blank lines", () => {
		const output = `main: abc123 def456 feature

other: ghi789 jkl012 other branch`
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(2)
	})

	test("parses bookmark with special characters in name", () => {
		const output = "feature/my-branch: abc123 def456 description"
		const result = parseBookmarkOutput(output)

		expect(result).toHaveLength(1)
		expect(result[0]?.name).toBe("feature/my-branch")
	})
})
