(*---
description: An extracted module with no end line fails in the parser.
ref: "util/MonolithSpecExtractor.java#module"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE missing_end_line ----
EXTENDS Other
ASSUME A = 1
====
---- MODULE Other ----
A == 1

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 2, column 7 and token "1" 
    | Residual stack trace follows:
    | Module definition starting at line 1, column 1.
    | Fatal errors while parsing TLA+ spec in file missing_end_line
    | In module Other
    | Could not parse module Other from file Other.tla
    | *** Errors: 1
    | In module Other
    | Could not parse module Other from file Other.tla
    3002:1 Parsing or semantic analysis failed.
---*)
