(*---
description: A raw newline inside a string is rejected even when a close quote follows on the next line.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE raw_newline_inside ----
Test == "ab
cd" = "x"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "\n" (10), after : "\"ab"
    | Fatal errors while parsing TLA+ spec in file raw_newline_inside
    | In module raw_newline_inside
    | Could not parse module raw_newline_inside from file raw_newline_inside.tla
    | *** Errors: 1
    | In module raw_newline_inside
    | Could not parse module raw_newline_inside from file raw_newline_inside.tla
    3002:1 Parsing or semantic analysis failed.
---*)
