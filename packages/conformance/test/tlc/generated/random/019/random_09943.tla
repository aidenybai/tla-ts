(*---
description: Evaluates a random function expression, seed 262, number 9943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE) @@ ([b15467 \in SUBSET {1} |-> 3] @@ (7 :> 0))) @@ [[a |-> (2 \div -1), b |-> (<<>> \/ TRUE)] EXCEPT !.a = @ + IF (~TRUE) THEN LET b15468 == 2147483647 IN b15468 ELSE (2147483647 + 0)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 125 to line 14, col 128 of module random_09943 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | Field Value starting at line 14, column 116.
    | Fatal errors while parsing TLA+ spec in file random_09943
    | In module random_09943
    | Could not parse module random_09943 from file random_09943.tla
    | *** Errors: 1
    | In module random_09943
    | Could not parse module random_09943 from file random_09943.tla
    3002:1 Parsing or semantic analysis failed.
---*)
