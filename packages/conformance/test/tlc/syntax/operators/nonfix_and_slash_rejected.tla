(*---
description: "/\\(a, b) is rejected, because the /\\ token begins a junction list and a parenthesized comma follows; only \\land has a nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [operators]
outcome: parse-error
---*)
---- MODULE nonfix_and_slash_rejected ----
Test == /\(TRUE, FALSE)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 8, column 16 and token "TRUE" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 11.
    | Expression starting at line 8, column 11.
    | Junction Item starting at line 8, column 9.
    | AND-OR Junction starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Fatal errors while parsing TLA+ spec in file nonfix_and_slash_rejected
    | In module nonfix_and_slash_rejected
    | Could not parse module nonfix_and_slash_rejected from file nonfix_and_slash_rejected.tla
    | *** Errors: 1
    | In module nonfix_and_slash_rejected
    | Could not parse module nonfix_and_slash_rejected from file nonfix_and_slash_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
