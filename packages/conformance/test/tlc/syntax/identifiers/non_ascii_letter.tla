(*---
description: Non-ASCII letters are not legal in an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE non_ascii_letter ----
é == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 1.  Encountered: "\u00e9" (233), after : ""
    | Fatal errors while parsing TLA+ spec in file non_ascii_letter
    | In module non_ascii_letter
    | Could not parse module non_ascii_letter from file non_ascii_letter.tla
    | *** Errors: 1
    | In module non_ascii_letter
    | Could not parse module non_ascii_letter from file non_ascii_letter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
