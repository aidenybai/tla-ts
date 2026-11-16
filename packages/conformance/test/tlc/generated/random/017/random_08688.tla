(*---
description: Evaluates a random record expression, seed 262, number 8688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (-1 = -1) THEN ((1 :> 2))[1] ELSE (2147483647 \div 3), b |-> ((TRUE /\ <<5, 6>>) \in (SUBSET {1} \ {x \in 1..3 : x > 1}))] EXCEPT !.a = @ + ([([x \in Nat |-> x + 1] @@ <<5, 6>>) EXCEPT ![(2147483647 \div -1)] = (-1 * 7)])[LET b13456 == (1 * 0) IN (b13456 \div b13456)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 226 to line 14, col 229 of module random_08688 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 215.
    | Expression starting at line 14, column 215.
    | ExtendableExpr starting at line 14, column 214.
    | Expression starting at line 14, column 214.
    | Except Component starting at line 14, column 213.
    | Fatal errors while parsing TLA+ spec in file random_08688
    | In module random_08688
    | Could not parse module random_08688 from file random_08688.tla
    | *** Errors: 1
    | In module random_08688
    | Could not parse module random_08688 from file random_08688.tla
    3002:1 Parsing or semantic analysis failed.
---*)
