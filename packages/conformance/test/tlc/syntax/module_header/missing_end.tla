(*---
description: A file that stops inside the module is a parse error.
ref: "tla2sany/parser/TLAplusParser.java#Module"
features: [module_header]
outcome: parse-error
---*)
---- MODULE missing_end ----
ASSUME TRUE

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 8, column 12 and token "TRUE" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file missing_end
    | In module missing_end
    | Could not parse module missing_end from file missing_end.tla
    | *** Errors: 1
    | In module missing_end
    | Could not parse module missing_end from file missing_end.tla
    3002:1 Parsing or semantic analysis failed.
---*)
