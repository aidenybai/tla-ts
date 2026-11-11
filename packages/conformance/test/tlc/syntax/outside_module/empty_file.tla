(*---
description: An empty file has no module.
ref: "tla2sany/parser/TLAplusParser.java#CompilationUnit"
features: [outside_module]
outcome: parse-error
---*)

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "---- MODULE (beginning of module)"
    | Encountered "<EOF>" at line 6, column 6 and token "" 
    | Residual stack trace follows:
    | Begin module starting at line 6, column 6.
    | Module definition starting at line 6, column 6.
    | Fatal errors while parsing TLA+ spec in file empty_file
    | In module empty_file
    | Could not parse module empty_file from file empty_file.tla
    | *** Errors: 1
    | In module empty_file
    | Could not parse module empty_file from file empty_file.tla
    3002:1 Parsing or semantic analysis failed.
---*)
