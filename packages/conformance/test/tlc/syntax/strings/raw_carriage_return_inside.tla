(*---
description: A raw carriage return inside a string is rejected.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE raw_carriage_return_inside ----
Test == "abcd" = "x"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "\r" (13), after : "\"ab"
    | Fatal errors while parsing TLA+ spec in file raw_carriage_return_inside
    | In module raw_carriage_return_inside
    | Could not parse module raw_carriage_return_inside from file raw_carriage_return_inside.tla
    | *** Errors: 1
    | In module raw_carriage_return_inside
    | Could not parse module raw_carriage_return_inside from file raw_carriage_return_inside.tla
    3002:1 Parsing or semantic analysis failed.
---*)
