(*---
description: Ported from TLC's ExamplesSimpleAllocatorTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesSimpleAllocatorTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  CONSTANTS
    c1 = c1
    c2 = c2
    c3 = c3
    r1 = r1
    r2 = r2
    Clients = {c1,c2,c3}
    Resources = {r1,r2}

  SPECIFICATION
    SimpleAllocator

  \** DOES NOT WORK FOR LIVENESS !
  \** SYMMETRY Symmetry

  INVARIANTS
    TypeInvariant ResourceMutex

  PROPERTIES
    ClientsWillReturn ClientsWillObtain InfOftenSatisfied
  PROPERTY
    AllocInfOftenEmpty
  POSTCONDITION
    PostCondition
args:
  - -lncheck
  - final
  - -deadlock
---*)
------------------------ MODULE SimpleAllocator -------------------------
(***********************************************************************)
(* Specification of an allocator managing a set of resources:          *)
(* - Clients can request sets of resources whenever all their previous *)
(*   requests have been satisfied.                                     *)
(* - Requests can be partly fulfilled, and resources can be returned   *)
(*   even before the full request has been satisfied. However, clients *)
(*   only have an obligation to return resources after they have       *)
(*   obtained all resources they requested.                            *)
(***********************************************************************)

EXTENDS FiniteSets, TLC, TLCExt

CONSTANTS
  Clients,     \* set of all clients
  Resources    \* set of all resources

ASSUME
  IsFiniteSet(Resources)

VARIABLES
  unsat,       \* set of all outstanding requests per process
  alloc        \* set of resources allocated to given process

TypeInvariant ==
  /\ unsat \in [Clients -> SUBSET Resources]
  /\ alloc \in [Clients -> SUBSET Resources]

-------------------------------------------------------------------------

(* Resources are available iff they have not been allocated. *)
available == Resources \ (UNION {alloc[c] : c \in Clients})

(* Initially, no resources have been requested or allocated. *)
Init == 
  /\ unsat = [c \in Clients |-> {}]
  /\ alloc = [c \in Clients |-> {}]

(* A client c may request a set of resources provided that all of its  *)
(* previous requests have been satisfied and that it doesn't hold any  *)
(* resources.                                                          *)
Request(c,S) ==
  /\ unsat[c] = {} /\ alloc[c] = {}
  /\ S # {} /\ unsat' = [unsat EXCEPT ![c] = S]
  /\ UNCHANGED alloc

(* Allocation of a set of available resources to a client that         *)
(* requested them (the entire request does not have to be filled).     *)
Allocate(c,S) ==
  /\ S # {} /\ S \subseteq available \cap unsat[c]
  /\ alloc' = [alloc EXCEPT ![c] = @ \cup S]
  /\ unsat' = [unsat EXCEPT ![c] = @ \ S]

(* Client c returns a set of resources that it holds. It may do so     *)
(* even before its full request has been honored.                      *)
Return(c,S) ==
  /\ S # {} /\ S \subseteq alloc[c]
  /\ alloc' = [alloc EXCEPT ![c] = @ \ S]
  /\ UNCHANGED unsat

(* The next-state relation. *)
Next == 
  \E c \in Clients, S \in SUBSET Resources :
     Request(c,S) \/ Allocate(c,S) \/ Return(c,S)

vars == <<unsat,alloc>>

-------------------------------------------------------------------------

(* The complete high-level specification. *)
SimpleAllocator == 
  /\ Init /\ [][Next]_vars
  /\ \A c \in Clients: WF_vars(Return(c, alloc[c]))
  /\ \A c \in Clients: SF_vars(\E S \in SUBSET Resources: Allocate(c,S))

-------------------------------------------------------------------------

ResourceMutex ==
  \A c1,c2 \in Clients : c1 # c2 => alloc[c1] \cap alloc[c2] = {}

ClientsWillReturn ==
  \A c \in Clients : unsat[c]={} ~> alloc[c]={}

ClientsWillObtain ==
  \A c \in Clients, r \in Resources : r \in unsat[c] ~> r \in alloc[c]

InfOftenSatisfied == 
  \A c \in Clients : []<>(unsat[c] = {})

-------------------------------------------------------------------------

(* Used for symmetry reduction with TLC *)
Symmetry == Permutations(Clients) \cup Permutations(Resources)

-------------------------------------------------------------------------

(* The following version states a weaker fairness requirement for the  *)
(* clients: resources need be returned only if the entire request has  *)
(* been satisfied.                                                     *)

SimpleAllocator2 == 
  /\ Init /\ [][Next]_vars
  /\ \A c \in Clients: WF_vars(unsat[c] = {} /\ Return(c, alloc[c]))
  /\ \A c \in Clients: SF_vars(\E S \in SUBSET Resources: Allocate(c,S))


-------------------------------------------------------------------------

THEOREM SimpleAllocator => []TypeInvariant
THEOREM SimpleAllocator => []ResourceMutex
THEOREM SimpleAllocator => ClientsWillReturn
THEOREM SimpleAllocator2 => ClientsWillReturn
THEOREM SimpleAllocator => ClientsWillObtain
THEOREM SimpleAllocator => InfOftenSatisfied
(** The following do not hold:                          **)
(** THEOREM SimpleAllocator2 => ClientsWillObtain       **)
(** THEOREM SimpleAllocator2 => InfOftenSatisfied       **)

AllocInfOftenEmpty == []<>(\A c \in Clients : alloc[c] = {})

CONSTANT c1, c2, c3, r1, r2
PostCondition ==
CounterExample =
[ action |->
      { << << 1,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}) ] >>,
           [ name |-> "Request",
             location |->
                 [ beginLine |-> 43,
                   beginColumn |-> 3,
                   endLine |-> 45,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r1}],
             parameters |-> <<"c", "S">> ],
           << 2,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}) ] >> >>,
        << << 2,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}) ] >>,
           [ name |-> "Allocate",
             location |->
                 [ beginLine |-> 50,
                   beginColumn |-> 3,
                   endLine |-> 52,
                   endColumn |-> 41,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r1}],
             parameters |-> <<"c", "S">> ],
           << 3,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >> >>,
        << << 3,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
           [ name |-> "Request",
             location |->
                 [ beginLine |-> 43,
                   beginColumn |-> 3,
                   endLine |-> 45,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c2, S |-> {r2}],
             parameters |-> <<"c", "S">> ],
           << 4,
              [ unsat |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >> >>,
        << << 4,
              [ unsat |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
           [ name |-> "Allocate",
             location |->
                 [ beginLine |-> 50,
                   beginColumn |-> 3,
                   endLine |-> 52,
                   endColumn |-> 41,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c2, S |-> {r2}],
             parameters |-> <<"c", "S">> ],
           << 5,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >> >>,
        << << 5,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >>,
           [ name |-> "Return",
             location |->
                 [ beginLine |-> 57,
                   beginColumn |-> 3,
                   endLine |-> 59,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r1}],
             parameters |-> <<"c", "S">> ],
           << 6,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >> >>,
        << << 6,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >>,
           [ name |-> "Request",
             location |->
                 [ beginLine |-> 43,
                   beginColumn |-> 3,
                   endLine |-> 45,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r1, r2}],
             parameters |-> <<"c", "S">> ],
           << 7,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >> >>,
        << << 7,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >>,
           [ name |-> "Allocate",
             location |->
                 [ beginLine |-> 50,
                   beginColumn |-> 3,
                   endLine |-> 52,
                   endColumn |-> 41,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r1}],
             parameters |-> <<"c", "S">> ],
           << 8,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >> >>,
        << << 8,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
                alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >>,
           [ name |-> "Return",
             location |->
                 [ beginLine |-> 57,
                   beginColumn |-> 3,
                   endLine |-> 59,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c2, S |-> {r2}],
             parameters |-> <<"c", "S">> ],
           << 9,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >> >>,
        << << 9,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
           [ name |-> "Allocate",
             location |->
                 [ beginLine |-> 50,
                   beginColumn |-> 3,
                   endLine |-> 52,
                   endColumn |-> 41,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r2}],
             parameters |-> <<"c", "S">> ],
           << 10,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}) ] >> >>,
        << << 10,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}) ] >>,
           [ name |-> "Return",
             location |->
                 [ beginLine |-> 57,
                   beginColumn |-> 3,
                   endLine |-> 59,
                   endColumn |-> 20,
                   module |-> "SimpleAllocator" ],
             context |-> [c |-> c3, S |-> {r2}],
             parameters |-> <<"c", "S">> ],
           << 3,
              [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
                alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >> >> },
  state |->
      { << 1,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}) ] >>,
        << 2,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}) ] >>,
        << 3,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
        << 4,
           [ unsat |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
        << 5,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >>,
        << 6,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >>,
        << 7,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}),
             alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {}) ] >>,
        << 8,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
             alloc |-> (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1}) ] >>,
        << 9,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r2}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1}) ] >>,
        << 10,
           [ unsat |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {}),
             alloc |-> (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2}) ] >> } ]

=========================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 10 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 10 branches of temporal properties for the complete state space with 4000 total distinct states at (<date>)
    2116:1 Temporal property AllocInfOftenEmpty was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    2217:4 2: <Request(c3,{r1}) line 79, col 3 to line 81, col 20 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    2217:4 3: <Allocate(c3,{r1}) line 86, col 3 to line 88, col 41 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1})
    2217:4 4: <Request(c2,{r2}) line 79, col 3 to line 81, col 20 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {r2} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1})
    2217:4 5: <Allocate(c2,{r2}) line 86, col 3 to line 88, col 41 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1})
    2217:4 6: <Return(c3,{r1}) line 93, col 3 to line 95, col 20 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {r2} @@ c3 :> {})
    2217:4 7: <Request(c3,{r1, r2}) line 79, col 3 to line 81, col 20 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2})
    /\ alloc = (c1 :> {} @@ c2 :> {r2} @@ c3 :> {})
    2217:4 8: <Allocate(c3,{r1}) line 86, col 3 to line 88, col 41 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {r2})
    /\ alloc = (c1 :> {} @@ c2 :> {r2} @@ c3 :> {r1})
    2217:4 9: <Return(c2,{r2}) line 93, col 3 to line 95, col 20 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {r2})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1})
    2217:4 10: <Allocate(c3,{r2}) line 86, col 3 to line 88, col 41 of module SimpleAllocator>
    /\ unsat = (c1 :> {} @@ c2 :> {} @@ c3 :> {})
    /\ alloc = (c1 :> {} @@ c2 :> {} @@ c3 :> {r1, r2})
    2122:4 3: Back to state: <Return(c3,{r2}) line 93, col 3 to line 95, col 20 of module SimpleAllocator>
    2404:1 Postcondition PostCondition at line 159, col 1 to line 341, col 72 of module SimpleAllocator is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 1633 states generated, 400 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 6.
---*)
