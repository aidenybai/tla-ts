(*---
description: "*) inside a string inside a comment still closes the comment, leaving a stray string."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
outcome: parse-error
---*)
---- MODULE block_comment_string_does_not_protect_close ----
(* "*)" *)
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 11.  Encountered: "\n" (10), after : "\" *)"
    | Fatal errors while parsing TLA+ spec in file block_comment_string_does_not_protect_close
    | In module block_comment_string_does_not_protect_close
    | Could not parse module block_comment_string_does_not_protect_close from file block_comment_string_does_not_protect_close.tla
    | *** Errors: 1
    | In module block_comment_string_does_not_protect_close
    | Could not parse module block_comment_string_does_not_protect_close from file block_comment_string_does_not_protect_close.tla
    3002:1 Parsing or semantic analysis failed.
---*)
