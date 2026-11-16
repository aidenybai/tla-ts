(*---
description: Evaluates a random function expression, seed 262, number 8602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b13324 \in (<<3, 1, 2>> \ SUBSET {1}) |-> (b13324 \div -1)] @@ (([a |-> 1]).a :> Cardinality(2..1))) @@ (Append((<<>> \o <<1, 2>>), IF FALSE THEN 7 ELSE 7) \o SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 69 to line 14, col 72 of module random_08602 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | Some [] Form starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_08602
    | In module random_08602
    | Could not parse module random_08602 from file random_08602.tla
    | *** Errors: 1
    | In module random_08602
    | Could not parse module random_08602 from file random_08602.tla
    3002:1 Parsing or semantic analysis failed.
---*)
