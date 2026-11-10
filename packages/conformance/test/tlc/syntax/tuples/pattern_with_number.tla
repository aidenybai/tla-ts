(*---
description: A tuple pattern holds only names.
ref: "tla2sany/parser/TLAplusParser.java#IdentifierTuple"
features: [tuples]
outcome: parse-error
---*)
---- MODULE pattern_with_number ----
Test == \A <<x, 1>> \in {} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "COMMA or >>"
    | Encountered "1" at line 8, column 17 and token "," 
    | Residual stack trace follows:
    | Identifier tuple starting at line 8, column 12.
    | Quant Bound starting at line 8, column 12.
    | Quantified form starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file pattern_with_number
    | In module pattern_with_number
    | Could not parse module pattern_with_number from file pattern_with_number.tla
    | *** Errors: 1
    | In module pattern_with_number
    | Could not parse module pattern_with_number from file pattern_with_number.tla
    3002:1 Parsing or semantic analysis failed.
---*)
