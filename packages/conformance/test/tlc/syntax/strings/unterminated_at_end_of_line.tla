(*---
description: "A string cannot cross a newline, so an unclosed string is a lexical error."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unterminated_at_end_of_line ----
Test == "abc
  = "abc"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 13.  Encountered: "\n" (10), after : "\"abc"
    | Fatal errors while parsing TLA+ spec in file unterminated_at_end_of_line
    | In module unterminated_at_end_of_line
    | Could not parse module unterminated_at_end_of_line from file unterminated_at_end_of_line.tla
    | *** Errors: 1
    | In module unterminated_at_end_of_line
    | Could not parse module unterminated_at_end_of_line from file unterminated_at_end_of_line.tla
    3002:1 Parsing or semantic analysis failed.
---*)
