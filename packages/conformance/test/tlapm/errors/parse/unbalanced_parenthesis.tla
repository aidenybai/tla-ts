(*---
description: An opening parenthesis without its closing one makes the module fail to parse at the parenthesis.
ref: src/expr/e_parser.ml#expr
mode: obligations
outcome: rejected
---*)
---- MODULE unbalanced_parenthesis ----
THEOREM (TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unbalanced_parenthesis.tla", line 8, character 8
    Unexpected (

    @type: warning
    @msg: File "./unbalanced_parenthesis.tla", line 8, character 8

    Unexpected (

    File "./unbalanced_parenthesis.tla", line 8, character 8
    Unexpected (
    File "<unknown>":
    Error: Could not parse "./unbalanced_parenthesis.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
