(*---
description: A SANY warning in the list fails the parse.
ref: tla2sany/semantic/ErrorCode.java
outcome: parse-error
config: ""
args:
  - -messagesAsErrors
  - "4802"
---*)
---- MODULE sany_warning_fails_parse ----
a == 1
ASSUME [a |-> 2].a = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Warning treated as error: line 12, col 9 to line 12, col 9 of module sany_warning_fails_parse
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 11, col 1 to line 11, col 6 of module sany_warning_fails_parse.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    3002:1 Parsing or semantic analysis failed.
---*)
