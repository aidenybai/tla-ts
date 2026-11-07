(*---
description: A tuple cannot have an empty element.
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE double_comma ----
Test == <<1,,2>> = <<1,2>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 8, column 13 and token "," 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 13.
    | Expression starting at line 8, column 13.
    | Some << -- >> or >>_ Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Fatal errors while parsing TLA+ spec in file double_comma
    | In module double_comma
    | Could not parse module double_comma from file double_comma.tla
    | *** Errors: 1
    | In module double_comma
    | Could not parse module double_comma from file double_comma.tla
    3002:1 Parsing or semantic analysis failed.
---*)
