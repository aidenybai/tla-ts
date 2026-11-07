(*---
description: "Extraction stops at the first end line, so a nested module inside the extracted one leaves it unterminated."
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE nested_module_ends_extraction ----
EXTENDS Other
ASSUME A = 1
====
---- MODULE Other ----
---- MODULE In ----
====
A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 3, column 5 and token "====" 
    | Residual stack trace follows:
    | Module definition starting at line 1, column 1.
    | Fatal errors while parsing TLA+ spec in file nested_module_ends_extraction
    | In module Other
    | Could not parse module Other from file Other.tla
    | *** Errors: 1
    | In module Other
    | Could not parse module Other from file Other.tla
    3002:1 Parsing or semantic analysis failed.
---*)
