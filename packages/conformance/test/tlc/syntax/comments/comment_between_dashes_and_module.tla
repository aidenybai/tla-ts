(*---
description: "The opening dashes and MODULE keyword form one token, so a comment cannot split it."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#jjMoveNfa_0"
features: [comments]
outcome: parse-error
---*)
---- (* c *) MODULE comment_between_dashes_and_module ----
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
    | Fatal errors while parsing TLA+ spec in file comment_between_dashes_and_module
    | In module comment_between_dashes_and_module
    | Could not parse module comment_between_dashes_and_module from file comment_between_dashes_and_module.tla
    | *** Errors: 1
    | In module comment_between_dashes_and_module
    | Could not parse module comment_between_dashes_and_module from file comment_between_dashes_and_module.tla
    3002:1 Parsing or semantic analysis failed.
---*)
