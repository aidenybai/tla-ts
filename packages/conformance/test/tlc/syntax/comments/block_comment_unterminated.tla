(*---
description: A block comment still open at the end of the file is a lexical error that names the line near the start.
ref: "tla2sany/parser/TLAplusParser.java#parse"
features: [comments]
outcome: parse-error
---*)
---- MODULE block_comment_unterminated ----
Test == TRUE
(* never closed
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical {error: EOF reached, possibly open comment starting around line 9
    | Fatal errors while parsing TLA+ spec in file block_comment_unterminated
    | In module block_comment_unterminated
    | Could not parse module block_comment_unterminated from file block_comment_unterminated.tla
    | *** Errors: 1
    | In module block_comment_unterminated
    | Could not parse module block_comment_unterminated from file block_comment_unterminated.tla
    3002:1 Parsing or semantic analysis failed.
---*)
