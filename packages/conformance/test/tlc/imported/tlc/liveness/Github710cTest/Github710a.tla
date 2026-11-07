(*---
description: Ported from TLC's Github710cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github710cTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION FairSpec
  PROPERTY AtMostOnce
  PROPERTY neg_AtMostOnce
  PROPERTY EventuallyFlipBack
  CONSTRAINT StateConstraint
  PROPERTY Tautology
args:
  - -deadlock
---*)
---- MODULE Github710a ----
EXTENDS TLC, TLCExt
VARIABLE x
vars == <<x>>

Init == x = FALSE

Next == x' \in BOOLEAN 

Spec == 
    /\ Init
    /\ [][Next]_vars
    \* /\ WF_x(Next)

StateConstraint ==
    TRUE

\* This is property to check
AtMostOnce == [](x => [](~x => []~x)) \* G(x => G(~x => G~x))

AtMostOnceEquiv == [](~x \/ [](x \/ []~x)) \* G(~x \/ G(x \/ G~x))

PostCondition ==
	/\ TLCSet(42, TLCGet("generated"))
	/\ ToTrace(CounterExample) = <<[x |-> FALSE], [x |-> TRUE], [x |-> FALSE], [x |-> TRUE]>>
	/\ CounterExample =
				[ action |->
			      { << <<1, [x |-> FALSE]>>,
			           [ name |-> "Next",
			             location |->
			                 [ beginLine |-> 8,
			                   beginColumn |-> 9,
			                   endLine |-> 8,
			                   endColumn |-> 22,
			                   module |-> "Github710a" ] ],
			           <<2, [x |-> TRUE]>> >>,
			        << <<2, [x |-> TRUE]>>,
			           [ name |-> "Next",
			             location |->
			                 [ beginLine |-> 8,
			                   beginColumn |-> 9,
			                   endLine |-> 8,
			                   endColumn |-> 22,
			                   module |-> "Github710a" ] ],
			           <<3, [x |-> FALSE]>> >>,
			        << <<3, [x |-> FALSE]>>,
			           [ name |-> "Next",
			             location |->
			                 [ beginLine |-> 8,
			                   beginColumn |-> 9,
			                   endLine |-> 8,
			                   endColumn |-> 22,
			                   module |-> "Github710a" ] ],
			           <<4, [x |-> TRUE]>> >> },
			  state |->
			      { <<1, [x |-> FALSE]>>,
			        <<2, [x |-> TRUE]>>,
			        <<3, [x |-> FALSE]>>,
			        <<4, [x |-> TRUE]>> } ]

FairSpec == 
    /\ Spec
    /\ WF_x(Next)

neg_AtMostOnce == ~(AtMostOnce)

EventuallyFlipBack == (x = TRUE) ~> (x = FALSE)

Tautology == (vars = vars) ~> (vars = vars)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    | line 41, col 41 to line 41, col 41 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 41, col 56 to line 41, col 56 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 41, col 70 to line 41, col 70 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 41, col 85 to line 41, col 85 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 44, col 42 to line 44, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 52, col 42 to line 52, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 53, col 42 to line 53, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 61, col 42 to line 61, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 62, col 42 to line 62, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 70, col 42 to line 70, col 42 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 72, col 39 to line 72, col 39 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 73, col 39 to line 73, col 39 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 74, col 39 to line 74, col 39 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 75, col 39 to line 75, col 39 of module Github710a
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 19, col 10 to line 19, col 10 of module Github710a.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 8 total distinct states at (<date>)
    2116:1 Temporal property AtMostOnce was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = FALSE
    2217:4 2: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    x = TRUE
    2217:4 3: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    x = FALSE
    2217:4 4: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    x = TRUE
    2217:4 5: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    x = FALSE
    2217:4 6: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    x = TRUE
    2122:4 5: Back to state: <Next line 24, col 9 to line 24, col 22 of module Github710a>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
