(*---
description: An instance name alone is not an operator, so citing it as a fact is an unknown operator.
ref: src/expr/e_anon.ml#anon_sg
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE instance_name_as_fact ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM TRUE
  BY I
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./instance_name_as_fact.tla", line 13, character 6

    Operator "I" not found

    File "./instance_name_as_fact.tla", line 13, character 6:
    Error: Operator "I" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
