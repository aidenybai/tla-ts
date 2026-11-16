(*---
description: << cannot be closed by ).
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE mismatched_bracket ----
Test == <<1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ")" at line 8, column 12 and token "1" 
    | Residual stack trace follows:
    | Some << -- >> or >>_ Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file mismatched_bracket
    | In module mismatched_bracket
    | Could not parse module mismatched_bracket from file mismatched_bracket.tla
    | *** Errors: 1
    | In module mismatched_bracket
    | Could not parse module mismatched_bracket from file mismatched_bracket.tla
    3002:1 Parsing or semantic analysis failed.
---*)
