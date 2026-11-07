(*---
description: Evaluates a random seq expression, seed 262, number 2990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(SubSeq(([a |-> 1] = <<5, 6>>), IF FALSE THEN 3 ELSE 1, (7 \div -1)), LAMBDA p, q : p < q), CASE (({x \in 1..3 : x > 1} = {2, 1, 3}) \/ (\A b4749 \in {} : TRUE)) -> ((0 - <<3, 1, 2>>))[(<<5, 6>>)[2]] [] OTHER -> (CASE FALSE -> 3 [] OTHER -> 1 + Cardinality(SUBSET {1})), Cardinality({(-0) : b4750 \in (Nat \cup {})})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 89 to line 14, col 92 of module random_02990 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | Optional Arguments starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_02990
    | In module random_02990
    | Could not parse module random_02990 from file random_02990.tla
    | *** Errors: 1
    | In module random_02990
    | Could not parse module random_02990 from file random_02990.tla
    3002:1 Parsing or semantic analysis failed.
---*)
