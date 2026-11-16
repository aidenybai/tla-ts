(*---
description: Evaluates a random set expression, seed 262, number 9608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<([a |-> 1]).a, CASE TRUE -> -1 [] OTHER -> 0>>) .. IF [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = (1 \div -1)] THEN (({1} \cup SUBSET {1}) = UNION {{x \in 1..3 : x > 1}, SUBSET {1}}) ELSE ((<<1>>).a - Head(<<>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 137 to line 14, col 140 of module random_09608 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 135.
    | Expression starting at line 14, column 135.
    | ExtendableExpr starting at line 14, column 134.
    | Expression starting at line 14, column 134.
    | Except Spec starting at line 14, column 128.
    | Fatal errors while parsing TLA+ spec in file random_09608
    | In module random_09608
    | Could not parse module random_09608 from file random_09608.tla
    | *** Errors: 1
    | In module random_09608
    | Could not parse module random_09608 from file random_09608.tla
    3002:1 Parsing or semantic analysis failed.
---*)
