(*---
description: "=<< lexes as the =< operator followed by <1>, so comparing tuples with no spaces is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE equal_between_tuples_no_spaces ----
Test == <<1>>=<<1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "<1>" at line 8, column 16 and token "=<" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 16.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file equal_between_tuples_no_spaces
    | In module equal_between_tuples_no_spaces
    | Could not parse module equal_between_tuples_no_spaces from file equal_between_tuples_no_spaces.tla
    | *** Errors: 1
    | In module equal_between_tuples_no_spaces
    | Could not parse module equal_between_tuples_no_spaces from file equal_between_tuples_no_spaces.tla
    3002:1 Parsing or semantic analysis failed.
---*)
