(*---
description: "An undefined digit-led word is an unknown name, not a malformed number."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE number_letter_undefined ----
Test == 2x = 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 10 of module number_letter_undefined
    | Unknown operator: `2x'.
    3002:1 Parsing or semantic analysis failed.
---*)
