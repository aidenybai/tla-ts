(*---
description: "Only spaces may separate the opening dashes and MODULE, so a tab there leaves no opening token."
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
----	MODULE tab_before_module_keyword ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "---- MODULE (beginning of module)"
    | Encountered "<EOF>" at line 9, column 5 and token "" 
    | Residual stack trace follows:
    | Begin module starting at line 9, column 5.
    | Module definition starting at line 9, column 5.
    | Fatal errors while parsing TLA+ spec in file tab_before_module_keyword
    | In module tab_before_module_keyword
    | Could not parse module tab_before_module_keyword from file tab_before_module_keyword.tla
    | *** Errors: 1
    | In module tab_before_module_keyword
    | Could not parse module tab_before_module_keyword from file tab_before_module_keyword.tla
    3002:1 Parsing or semantic analysis failed.
---*)
