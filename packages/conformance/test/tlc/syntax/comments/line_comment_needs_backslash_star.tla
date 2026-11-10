(*---
description: "\\ * with a space is set difference then multiplication, not a comment."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
outcome: parse-error
---*)
---- MODULE line_comment_needs_backslash_star ----
Test == {} \ * nothing
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "nothing" at line 8, column 16 and token "*" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file line_comment_needs_backslash_star
    | In module line_comment_needs_backslash_star
    | Could not parse module line_comment_needs_backslash_star from file line_comment_needs_backslash_star.tla
    | *** Errors: 1
    | In module line_comment_needs_backslash_star
    | Could not parse module line_comment_needs_backslash_star from file line_comment_needs_backslash_star.tla
    3002:1 Parsing or semantic analysis failed.
---*)
