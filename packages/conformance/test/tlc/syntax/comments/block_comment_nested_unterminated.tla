(*---
description: "With a nested comment, one *) only closes the inner level, so the file ends inside the outer one."
ref: "tla2sany/parser/TLAplusParser.java#parse"
features: [comments]
outcome: parse-error
---*)
---- MODULE block_comment_nested_unterminated ----
Test == TRUE
(* outer (* inner *)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical {error: EOF reached, possibly open comment starting around line 9
    | Fatal errors while parsing TLA+ spec in file block_comment_nested_unterminated
    | In module block_comment_nested_unterminated
    | Could not parse module block_comment_nested_unterminated from file block_comment_nested_unterminated.tla
    | *** Errors: 1
    | In module block_comment_nested_unterminated
    | Could not parse module block_comment_nested_unterminated from file block_comment_nested_unterminated.tla
    3002:1 Parsing or semantic analysis failed.
---*)
