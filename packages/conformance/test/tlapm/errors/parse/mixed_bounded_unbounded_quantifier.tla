(*---
description: A quantifier cannot mix bounded and unbounded variables, so \A x \in S, z fails to parse.
ref: src/expr/e_parser.ml#expr
mode: obligations
outcome: rejected
---*)
---- MODULE mixed_bounded_unbounded_quantifier ----
CONSTANT S
THEOREM \A x \in S, z : x = z OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./mixed_bounded_unbounded_quantifier.tla", line 9, character 8
    Unexpected ,

    @type: warning
    @msg: File "./mixed_bounded_unbounded_quantifier.tla", line 9, character 8

    Unexpected ,

    File "./mixed_bounded_unbounded_quantifier.tla", line 9, character 8
    Unexpected ,
    File "<unknown>":
    Error: Could not parse "./mixed_bounded_unbounded_quantifier.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
