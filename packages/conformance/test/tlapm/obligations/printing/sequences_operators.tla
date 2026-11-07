(*---
description: Operators of Sequences are applied by name, and their definitions stay hidden.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE sequences_operators ----
EXTENDS Sequences
CONSTANT S
THEOREM Len(<<>>) = 0 /\ Append(<<>>, 1) \in Seq(S) \cup {<<1>>}
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S
    PROVE  Len(<<>>) = 0 /\ Append(<<>>, 1) \in Seq(S) \cup {<<1>>}

    @type: obligationsnumber
    @count: 1
---*)
