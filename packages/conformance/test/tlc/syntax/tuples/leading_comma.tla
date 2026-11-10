(*---
description: A tuple cannot begin with a comma.
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE leading_comma ----
Test == <<,1>> = <<1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 8, column 11 and token "<<" 
    | Residual stack trace follows:
    | Some << -- >> or >>_ Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file leading_comma
    | In module leading_comma
    | Could not parse module leading_comma from file leading_comma.tla
    | *** Errors: 1
    | In module leading_comma
    | Could not parse module leading_comma from file leading_comma.tla
    3002:1 Parsing or semantic analysis failed.
---*)
