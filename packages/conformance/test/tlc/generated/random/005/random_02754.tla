(*---
description: Evaluates a random bool expression, seed 262, number 2754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<(7 % 2147483647), (2147483647 \div -1)>>, (([x \in Nat |-> x + 1])[2] + (<<5, 6>>)[-1]), Len(SelectSeq(<<>>, LAMBDA e : e > 0))) = ((CASE FALSE -> 7 [] OTHER -> 2147483647 % (CHOOSE b4347 \in 1..3 : TRUE)) :> ([[a |-> 1] EXCEPT !.a = @ + 1]).a)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 56 to line 14, col 59 of module random_02754 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 45.
    | Expression starting at line 14, column 45.
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 44.
    | Some << -- >> or >>_ Form starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_02754
    | In module random_02754
    | Could not parse module random_02754 from file random_02754.tla
    | *** Errors: 1
    | In module random_02754
    | Could not parse module random_02754 from file random_02754.tla
    3002:1 Parsing or semantic analysis failed.
---*)
