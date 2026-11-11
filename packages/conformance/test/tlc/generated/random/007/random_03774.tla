(*---
description: Evaluates a random set expression, seed 262, number 3774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b5960 \in ({b5961 \in Nat : TRUE} \cap UNION {Nat, 1..3}) : ((b5960 * -1) < (2147483647 % b5960))), IF ([<<1>> EXCEPT ![1] = 2147483647] = ([a |-> 1, b |-> TRUE] @@ [x \in Nat |-> x + 1])) THEN Head(Append(<<3, 1, 2>>, 0)) ELSE Len(SubSeq(<<>>, 2147483647, (1 :> 2)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 93 to line 14, col 93 of module random_03774 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | ExtendableExpr starting at line 14, column 85.
    | Fatal errors while parsing TLA+ spec in file random_03774
    | In module random_03774
    | Could not parse module random_03774 from file random_03774.tla
    | *** Errors: 1
    | In module random_03774
    | Could not parse module random_03774 from file random_03774.tla
    3002:1 Parsing or semantic analysis failed.
---*)
