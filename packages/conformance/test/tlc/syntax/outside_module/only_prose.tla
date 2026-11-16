(*---
description: A file with no module at all is a parse error.
ref: "tla2sany/parser/TLAplusParser.java#CompilationUnit"
features: [outside_module]
outcome: parse-error
---*)
No module here.

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "---- MODULE (beginning of module)"
    | Encountered "<EOF>" at line 7, column 16 and token "" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 16.
    | Module definition starting at line 7, column 16.
    | Fatal errors while parsing TLA+ spec in file only_prose
    | In module only_prose
    | Could not parse module only_prose from file only_prose.tla
    | *** Errors: 1
    | In module only_prose
    | Could not parse module only_prose from file only_prose.tla
    3002:1 Parsing or semantic analysis failed.
---*)
