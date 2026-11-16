(*---
description: Evaluates a random seq expression, seed 262, number 1455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), ((1 % 3) \div ([a |-> 1]).a)), CASE ((1 .. 7) \subseteq (1..3 \cap 2..1)) -> IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (1 + 2147483647) ELSE Len(<<1>>) [] OTHER -> CASE (\A b2324 \in {x \in 1..3 : x > 1} : FALSE) -> (CHOOSE b2325 \in 1..3 : TRUE) [] OTHER -> ([x \in Nat |-> x + 1])[-1], IF ((3 * -1) \subseteq {3, 0}) THEN Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) ELSE LET b2326 == (FALSE)[-1] IN (<<5, 6>>)[7]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 392 to line 14, col 392 of module random_01455 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 390.
    | Expression starting at line 14, column 390.
    | ExtendableExpr starting at line 14, column 389.
    | Expression starting at line 14, column 389.
    | ExtendableExpr starting at line 14, column 388.
    | Fatal errors while parsing TLA+ spec in file random_01455
    | In module random_01455
    | Could not parse module random_01455 from file random_01455.tla
    | *** Errors: 1
    | In module random_01455
    | Could not parse module random_01455 from file random_01455.tla
    3002:1 Parsing or semantic analysis failed.
---*)
