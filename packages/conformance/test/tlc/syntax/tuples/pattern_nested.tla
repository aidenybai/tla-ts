(*---
description: A tuple pattern cannot nest.
ref: "tla2sany/parser/TLAplusParser.java#IdentifierTuple"
features: [tuples]
outcome: parse-error
---*)
---- MODULE pattern_nested ----
Test == \A <<x, <<y>>>> \in {} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "COMMA or >>"
    | Encountered "<<" at line 8, column 17 and token "," 
    | Residual stack trace follows:
    | Identifier tuple starting at line 8, column 12.
    | Quant Bound starting at line 8, column 12.
    | Quantified form starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file pattern_nested
    | In module pattern_nested
    | Could not parse module pattern_nested from file pattern_nested.tla
    | *** Errors: 1
    | In module pattern_nested
    | Could not parse module pattern_nested from file pattern_nested.tla
    3002:1 Parsing or semantic analysis failed.
---*)
