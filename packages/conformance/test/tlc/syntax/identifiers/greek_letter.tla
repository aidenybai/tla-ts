(*---
description: Greek letters are not legal in an identifier.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE greek_letter ----
α == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 1.  Encountered: "\u03b1" (945), after : ""
    | Fatal errors while parsing TLA+ spec in file greek_letter
    | In module greek_letter
    | Could not parse module greek_letter from file greek_letter.tla
    | *** Errors: 1
    | In module greek_letter
    | Could not parse module greek_letter from file greek_letter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
