(*---
description: String with comment start. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/string.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE string_string_with_comment_start ----
op == "\*"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 9, column 9.  Encountered: "*" (42), after : "\"\\"
    | Fatal errors while parsing TLA+ spec in file string_string_with_comment_start
    | In module string_string_with_comment_start
    | Could not parse module string_string_with_comment_start from file string_string_with_comment_start.tla
    | *** Errors: 1
    | In module string_string_with_comment_start
    | Could not parse module string_string_with_comment_start from file string_string_with_comment_start.tla
    3002:1 Parsing or semantic analysis failed.
---*)
