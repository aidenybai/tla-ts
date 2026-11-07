(*---
description: An operator with a missing operand ends tlapm abnormally with a parse error.
mode: obligations
outcome: rejected
---*)
---- MODULE parse_error ----
THEOREM 1 + = 2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./parse_error.tla", line 7, character 8
    incomplete expression

    @type: warning
    @msg: File "./parse_error.tla", line 7, character 8

    incomplete expression

    File "./parse_error.tla", line 7, character 8
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./parse_error.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
