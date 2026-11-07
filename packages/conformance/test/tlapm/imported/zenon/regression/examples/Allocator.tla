(*---
description: Zenon's regression test zenon/regression/examples/Allocator.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/Allocator.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
-------------------------- MODULE Allocator -----------------------------

(***********************************************************************)
(* Specification of an allocator managing a set of resources:          *)
(* - Clients can request sets of resources whenever all their previous *)
(*   requests have been satisfied.                                     *)
(* - Requests can be partly fulfilled, and resources can be returned   *)
(*   even before the full request has been satisfied. However, clients *)
(*   only have an obligation to return resources after they have       *)
(*   obtained all resources they requested.                            *)
(***********************************************************************)

\* EXTENDS FiniteSets, TLC

CONSTANTS
  Client,     \* set of all clients
  Resource    \* set of all resources

\* ASSUME
\*  IsFiniteSet(Resource)

VARIABLES
  unsat,       \* set of all outstanding requests per process
  alloc        \* set of resources allocated to given process

TypeInvariant ==
  /\ unsat \in [Client -> SUBSET Resource]
  /\ alloc \in [Client -> SUBSET Resource]

-------------------------------------------------------------------------

(* Resource are available iff they have not been allocated. *)
available == Resource \ (UNION {alloc[c] : c \in Client})

(* Initially, no resources have been requested or allocated. *)
Init ==
  /\ unsat = [c \in Client |-> {}]
  /\ alloc = [c \in Client |-> {}]

(**********************************************************************)
(* A client c may request a set of resources provided that all of its *)
(* previous requests have been satisfied and that it doesn't hold any *)
(* resources.                                                         *)
(**********************************************************************)
Request(c,S) ==
  /\ unsat[c] = {} /\ alloc[c] = {}
  /\ S # {} /\ unsat' = [unsat EXCEPT ![c] = S]
  /\ UNCHANGED alloc
  /\ alloc' = alloc

(*******************************************************************)
(* Allocation of a set of available resources to a client that     *)
(* requested them (the entire request does not have to be filled). *)
(*******************************************************************)
Allocate(c,S) ==
  /\ S # {} /\ S \subseteq available \cap unsat[c]
  /\ alloc' = [alloc EXCEPT ![c] = alloc[c] \cup S]
  /\ unsat' = [unsat EXCEPT ![c] = unsat[c] \ S]

(*******************************************************************)
(* Client c returns a set of resources that it holds. It may do so *)
(* even before its full request has been honored.                  *)
(*******************************************************************)
Return(c,S) ==
  /\ S # {} /\ S \subseteq alloc[c]
  /\ alloc' = [alloc EXCEPT ![c] = alloc[c] \ S]
  /\ UNCHANGED unsat
  /\ unsat' = unsat

(* The next-state relation. *)
Next ==
  \E c \in Client, S \in SUBSET Resource :
     Request(c,S) \/ Allocate(c,S) \/ Return(c,S)

vars == <<unsat,alloc>>

-------------------------------------------------------------------------

(*

(* The complete high-level specification. *)
SimpleAllocator ==
  /\ Init /\ [][Next]_vars
  /\ \A c \in Client: WF_vars(Return(c, alloc[c]))
  /\ \A c \in Client: SF_vars(\E S \in SUBSET Resource: Allocate(c,S))

*)

-------------------------------------------------------------------------

Mutex ==
  \A c1,c2 \in Client : \A r \in Resource :
     r \in alloc[c1] \cap alloc[c2] => c1 = c2

ClientsWillReturn ==
  \A c \in Client : unsat[c]={} ~> alloc[c]={}

ClientsWillObtain ==
  \A c \in Client, r \in Resource : r \in unsat[c] ~> r \in alloc[c]

InfOftenSatisfied ==
  \A c \in Client : []<>(unsat[c] = {})

-------------------------------------------------------------------------

(* Used for symmetry reduction with TLC *)
\* Symmetry == Permutations(Client) \cup Permutations(Resource)

-------------------------------------------------------------------------

(**********************************************************************)
(* The following version states a weaker fairness requirement for the *)
(* clients: resources need be returned only if the entire request has *)
(* been satisfied.                                                    *)
(**********************************************************************)

(*

SimpleAllocator2 ==
  /\ Init /\ [][Next]_vars
  /\ \A c \in Client: WF_vars(unsat[c] = {} /\ Return(c, alloc[c]))
  /\ \A c \in Client: SF_vars(\E S \in SUBSET Resource: Allocate(c,S))

*)

-------------------------------------------------------------------------

THEOREM InitTypeInvariant == Init => TypeInvariant
BY DEFS Init, TypeInvariant

THEOREM RequestTypeInvariant ==
  ASSUME NEW c \in Client,
         NEW S \in SUBSET Resource
  PROVE  TypeInvariant /\ Request(c,S) => TypeInvariant'
BY DEFS TypeInvariant, Request

THEOREM AllocateTypeInvariant ==
  ASSUME NEW c \in Client,
         NEW S \in SUBSET Resource
  PROVE  TypeInvariant /\ Allocate(c,S) => TypeInvariant'
BY DEFS TypeInvariant, Allocate

THEOREM ReturnTypeInvariant ==
  ASSUME NEW c \in Client,
         NEW S \in SUBSET Resource
  PROVE  TypeInvariant /\ Return(c,S) => TypeInvariant'
BY DEFS TypeInvariant, Return

THEOREM NextTypeInvariant == TypeInvariant /\ Next => TypeInvariant'
<1>1. ASSUME TypeInvariant, Next
      PROVE TypeInvariant'
  <2>. PICK c \in Client,
            S \in SUBSET Resource :
              \/ Request(c, S)
              \/ Allocate(c, S)
              \/ Return(c, S)
    BY <1>1!2 DEF Next         \** TypeInvariant assumption not needed
  <2>. QED
    BY <1>1,
       RequestTypeInvariant,
       AllocateTypeInvariant,
       ReturnTypeInvariant
<1>2. QED
  BY <1>1

-------------------------------------------------------------------------

THEOREM InitMutex == Init => Mutex
BY DEFS Init, Mutex

THEOREM RequestMutex ==
  ASSUME NEW clt \in Client,
         NEW S \in SUBSET Resource
  PROVE  Mutex /\ Request(clt,S) => Mutex'
BY DEFS Mutex, Request

THEOREM ReturnMutex ==
  ASSUME NEW clt \in Client,
         NEW S \in SUBSET Resource
  PROVE  TypeInvariant /\ Mutex /\ Return(clt,S) => Mutex'
<1>1. SUFFICES
        ASSUME TypeInvariant,
               Mutex,
               Return(clt,S)
        PROVE  Mutex'
  OBVIOUS
<1>2. SUFFICES
        ASSUME NEW c1 \in Client,
               NEW c2 \in Client,
               NEW r \in Resource,
               r \in alloc'[c1] \cap alloc'[c2]
        PROVE  c1 = c2
  BY DEF Mutex
<1>3. alloc'[c1] \subseteq alloc[c1]
  BY <1>1
  DEF Return, TypeInvariant
<1>4. alloc'[c2] \subseteq alloc[c2]
  BY <1>1
  DEF Return, TypeInvariant
<1>5. QED
  BY <1>1, <1>2, <1>3, <1>4
  DEF Mutex, TypeInvariant

THEOREM AllocateMutex ==
  ASSUME NEW clt \in Client,
         NEW S \in SUBSET Resource
  PROVE  TypeInvariant /\ Mutex /\ Allocate(clt, S) => Mutex'
<1>1. SUFFICES
        ASSUME TypeInvariant,
               Mutex,
               Allocate(clt,S)
        PROVE  Mutex'
  OBVIOUS
<1>2. SUFFICES
        ASSUME NEW c1 \in Client,
               NEW c2 \in Client,
               NEW r \in Resource,
               r \in alloc'[c1] \cap alloc'[c2]
        PROVE  c1 = c2
  BY DEF Mutex
<1>3. CASE ~(c1 = clt \/ c2 = clt)
  <2>1. alloc'[c1] = alloc[c1] /\ alloc'[c2] = alloc[c2]
    BY <1>1, <1>2, <1>3
    DEF Allocate, TypeInvariant
  <2>2. QED
    BY <1>1, <1>2, <2>1
    DEF Mutex, TypeInvariant
    (* mutex in pre-state, typing *)
<1>4. CASE c1 = clt
  <2>1. SUFFICES ASSUME c1 # c2
                 PROVE FALSE
    OBVIOUS
  <2>2. alloc'[c2] = alloc[c2]
    BY <1>1, <1>4, <2>1
    DEFS Allocate, TypeInvariant
  <2>3. r \notin alloc[c1]
    BY <1>1, <1>2, <2>1, <2>2
    DEFS Mutex, TypeInvariant
  <2>4. r \notin available
    BY <1>1, <1>2, <2>2, <2>1
    DEFS available, TypeInvariant
  <2>5. r \notin S
    BY <1>1, <1>2, <2>4
    DEF Allocate
  <2>6. r \notin alloc'[c1]
    BY <1>1, <2>3, <2>5
    DEFS Allocate, TypeInvariant
  <2>7. QED
    BY <1>1, <1>2, <2>1,
       <2>2, <2>3, <2>4, <2>5, <2>6
    DEFS Allocate, TypeInvariant
<1>5. CASE c2 = clt
  <2>1. SUFFICES ASSUME c1 # c2
                 PROVE FALSE
    OBVIOUS
  <2>2. alloc'[c1] = alloc[c1]
    BY <1>1, <1>4, <2>1
    DEFS Allocate, TypeInvariant
  <2>3. r \notin alloc[c2]
    BY <1>1, <1>2, <2>1, <2>2
    DEFS Mutex, TypeInvariant
  <2>4. r \notin available
    BY <1>1, <1>2, <2>2, <2>1
    DEF available, TypeInvariant
  <2>5. r \notin S
    BY <1>1, <1>2, <2>4
    DEF Allocate
  <2>6. r \notin alloc'[c2]
    BY <1>1, <2>3, <2>5
    DEFS Allocate, TypeInvariant
  <2>7. QED
    BY <1>1, <1>2, <2>1,
       <2>2, <2>3, <2>4, <2>5, <2>6
    DEFS Allocate, TypeInvariant
<1>6. QED
  BY <1>3, <1>4, <1>5

THEOREM NextMutex == TypeInvariant /\ Mutex /\ Next => Mutex'
BY RequestMutex, AllocateMutex, ReturnMutex DEF Next


(*

THEOREM SimpleAllocator => []TypeInvariant
THEOREM SimpleAllocator => []Mutex
THEOREM SimpleAllocator => ClientsWillReturn
THEOREM SimpleAllocator2 => ClientsWillReturn
THEOREM SimpleAllocator => ClientsWillObtain
THEOREM SimpleAllocator => InfOftenSatisfied
(** The following do not hold:                          **)
(** THEOREM SimpleAllocator2 => ClientsWillObtain       **)
(** THEOREM SimpleAllocator2 => InfOftenSatisfied       **)

*)

=========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 140:1:140:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 140:1:140:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 146:1:146:3
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 146:1:146:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 152:1:152:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 152:1:152:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 158:1:158:3
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 158:1:158:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 175:3:175:5
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 175:3:175:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 175:6:175:10
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 175:6:175:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 170:5:170:7
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 170:5:170:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 8
    @loc: 170:8:170:12
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 170:8:170:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 171:8:171:28
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 171:8:171:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 172:8:172:29
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 172:8:172:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 173:8:173:27
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 173:8:173:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 168:5:168:7
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 168:5:168:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 13
    @loc: 168:8:168:14
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 168:8:168:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 180:1:180:3
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 180:1:180:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 16
    @loc: 186:1:186:3
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 186:1:186:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 17
    @loc: 212:3:212:5
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 212:3:212:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 18
    @loc: 212:6:212:10
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 212:6:212:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 19
    @loc: 212:12:212:16
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 212:12:212:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 212:18:212:22
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 212:18:212:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 21
    @loc: 212:24:212:28
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 212:24:212:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 22
    @loc: 197:3:197:10
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 197:3:197:10
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 23
    @loc: 204:3:204:5
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 204:3:204:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 24
    @loc: 206:3:206:5
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 206:3:206:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 25
    @loc: 206:6:206:10
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 206:6:206:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 209:3:209:5
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 209:3:209:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 27
    @loc: 209:6:209:10
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 209:6:209:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 287:3:287:5
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 287:3:287:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 29
    @loc: 287:6:287:10
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 287:6:287:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 30
    @loc: 287:12:287:16
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 287:12:287:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 31
    @loc: 287:18:287:22
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 287:18:287:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 32
    @loc: 224:3:224:10
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 224:3:224:10
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 33
    @loc: 231:3:231:5
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 231:3:231:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 34
    @loc: 237:5:237:7
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 237:5:237:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 35
    @loc: 237:8:237:12
    @status: to be proved

    @type: obligation
    @id: 35
    @loc: 237:8:237:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 36
    @loc: 237:14:237:18
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 237:14:237:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 37
    @loc: 237:20:237:24
    @status: to be proved

    @type: obligation
    @id: 37
    @loc: 237:20:237:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 38
    @loc: 234:5:234:7
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 234:5:234:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 39
    @loc: 234:8:234:12
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 234:8:234:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 40
    @loc: 234:14:234:18
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 234:14:234:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 41
    @loc: 234:20:234:24
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 234:20:234:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 42
    @loc: 260:5:260:7
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 260:5:260:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 43
    @loc: 260:8:260:12
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 260:8:260:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 44
    @loc: 260:14:260:18
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 260:14:260:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 45
    @loc: 260:20:260:24
    @status: to be proved

    @type: obligation
    @id: 45
    @loc: 260:20:260:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 46
    @loc: 261:8:261:12
    @status: to be proved

    @type: obligation
    @id: 46
    @loc: 261:8:261:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 47
    @loc: 261:14:261:18
    @status: to be proved

    @type: obligation
    @id: 47
    @loc: 261:14:261:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 48
    @loc: 261:20:261:24
    @status: to be proved

    @type: obligation
    @id: 48
    @loc: 261:20:261:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 49
    @loc: 261:26:261:30
    @status: to be proved

    @type: obligation
    @id: 49
    @loc: 261:26:261:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 50
    @loc: 261:32:261:36
    @status: to be proved

    @type: obligation
    @id: 50
    @loc: 261:32:261:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 51
    @loc: 243:5:243:12
    @status: to be proved

    @type: obligation
    @id: 51
    @loc: 243:5:243:12
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 52
    @loc: 245:5:245:7
    @status: to be proved

    @type: obligation
    @id: 52
    @loc: 245:5:245:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 53
    @loc: 245:8:245:12
    @status: to be proved

    @type: obligation
    @id: 53
    @loc: 245:8:245:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 54
    @loc: 245:14:245:18
    @status: to be proved

    @type: obligation
    @id: 54
    @loc: 245:14:245:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 55
    @loc: 245:20:245:24
    @status: to be proved

    @type: obligation
    @id: 55
    @loc: 245:20:245:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 56
    @loc: 248:5:248:7
    @status: to be proved

    @type: obligation
    @id: 56
    @loc: 248:5:248:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 57
    @loc: 248:8:248:12
    @status: to be proved

    @type: obligation
    @id: 57
    @loc: 248:8:248:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 58
    @loc: 248:14:248:18
    @status: to be proved

    @type: obligation
    @id: 58
    @loc: 248:14:248:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 59
    @loc: 248:20:248:24
    @status: to be proved

    @type: obligation
    @id: 59
    @loc: 248:20:248:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 60
    @loc: 248:26:248:30
    @status: to be proved

    @type: obligation
    @id: 60
    @loc: 248:26:248:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 61
    @loc: 251:5:251:7
    @status: to be proved

    @type: obligation
    @id: 61
    @loc: 251:5:251:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 62
    @loc: 251:8:251:12
    @status: to be proved

    @type: obligation
    @id: 62
    @loc: 251:8:251:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 63
    @loc: 251:14:251:18
    @status: to be proved

    @type: obligation
    @id: 63
    @loc: 251:14:251:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 64
    @loc: 251:20:251:24
    @status: to be proved

    @type: obligation
    @id: 64
    @loc: 251:20:251:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 65
    @loc: 251:26:251:30
    @status: to be proved

    @type: obligation
    @id: 65
    @loc: 251:26:251:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 66
    @loc: 254:5:254:7
    @status: to be proved

    @type: obligation
    @id: 66
    @loc: 254:5:254:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 67
    @loc: 254:8:254:12
    @status: to be proved

    @type: obligation
    @id: 67
    @loc: 254:8:254:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 68
    @loc: 254:14:254:18
    @status: to be proved

    @type: obligation
    @id: 68
    @loc: 254:14:254:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 69
    @loc: 254:20:254:24
    @status: to be proved

    @type: obligation
    @id: 69
    @loc: 254:20:254:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 70
    @loc: 257:5:257:7
    @status: to be proved

    @type: obligation
    @id: 70
    @loc: 257:5:257:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 71
    @loc: 257:8:257:12
    @status: to be proved

    @type: obligation
    @id: 71
    @loc: 257:8:257:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 72
    @loc: 257:14:257:18
    @status: to be proved

    @type: obligation
    @id: 72
    @loc: 257:14:257:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 73
    @loc: 257:20:257:24
    @status: to be proved

    @type: obligation
    @id: 73
    @loc: 257:20:257:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 74
    @loc: 283:5:283:7
    @status: to be proved

    @type: obligation
    @id: 74
    @loc: 283:5:283:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 75
    @loc: 283:8:283:12
    @status: to be proved

    @type: obligation
    @id: 75
    @loc: 283:8:283:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 76
    @loc: 283:14:283:18
    @status: to be proved

    @type: obligation
    @id: 76
    @loc: 283:14:283:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 77
    @loc: 283:20:283:24
    @status: to be proved

    @type: obligation
    @id: 77
    @loc: 283:20:283:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 78
    @loc: 284:8:284:12
    @status: to be proved

    @type: obligation
    @id: 78
    @loc: 284:8:284:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 79
    @loc: 284:14:284:18
    @status: to be proved

    @type: obligation
    @id: 79
    @loc: 284:14:284:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 80
    @loc: 284:20:284:24
    @status: to be proved

    @type: obligation
    @id: 80
    @loc: 284:20:284:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 81
    @loc: 284:26:284:30
    @status: to be proved

    @type: obligation
    @id: 81
    @loc: 284:26:284:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 82
    @loc: 284:32:284:36
    @status: to be proved

    @type: obligation
    @id: 82
    @loc: 284:32:284:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 83
    @loc: 266:5:266:12
    @status: to be proved

    @type: obligation
    @id: 83
    @loc: 266:5:266:12
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 84
    @loc: 268:5:268:7
    @status: to be proved

    @type: obligation
    @id: 84
    @loc: 268:5:268:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 85
    @loc: 268:8:268:12
    @status: to be proved

    @type: obligation
    @id: 85
    @loc: 268:8:268:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 86
    @loc: 268:14:268:18
    @status: to be proved

    @type: obligation
    @id: 86
    @loc: 268:14:268:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 87
    @loc: 268:20:268:24
    @status: to be proved

    @type: obligation
    @id: 87
    @loc: 268:20:268:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 88
    @loc: 271:5:271:7
    @status: to be proved

    @type: obligation
    @id: 88
    @loc: 271:5:271:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 89
    @loc: 271:8:271:12
    @status: to be proved

    @type: obligation
    @id: 89
    @loc: 271:8:271:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 90
    @loc: 271:14:271:18
    @status: to be proved

    @type: obligation
    @id: 90
    @loc: 271:14:271:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 91
    @loc: 271:20:271:24
    @status: to be proved

    @type: obligation
    @id: 91
    @loc: 271:20:271:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 92
    @loc: 271:26:271:30
    @status: to be proved

    @type: obligation
    @id: 92
    @loc: 271:26:271:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 93
    @loc: 274:5:274:7
    @status: to be proved

    @type: obligation
    @id: 93
    @loc: 274:5:274:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 94
    @loc: 274:8:274:12
    @status: to be proved

    @type: obligation
    @id: 94
    @loc: 274:8:274:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 95
    @loc: 274:14:274:18
    @status: to be proved

    @type: obligation
    @id: 95
    @loc: 274:14:274:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 96
    @loc: 274:20:274:24
    @status: to be proved

    @type: obligation
    @id: 96
    @loc: 274:20:274:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 97
    @loc: 274:26:274:30
    @status: to be proved

    @type: obligation
    @id: 97
    @loc: 274:26:274:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 98
    @loc: 277:5:277:7
    @status: to be proved

    @type: obligation
    @id: 98
    @loc: 277:5:277:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: true

    @type: obligation
    @id: 99
    @loc: 277:8:277:12
    @status: to be proved

    @type: obligation
    @id: 99
    @loc: 277:8:277:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 100
    @loc: 277:14:277:18
    @status: to be proved

    @type: obligation
    @id: 100
    @loc: 277:14:277:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 101
    @loc: 277:20:277:24
    @status: to be proved

    @type: obligation
    @id: 101
    @loc: 277:20:277:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 102
    @loc: 280:5:280:7
    @status: to be proved

    @type: obligation
    @id: 102
    @loc: 280:5:280:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 103
    @loc: 280:8:280:12
    @status: to be proved

    @type: obligation
    @id: 103
    @loc: 280:8:280:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 104
    @loc: 280:14:280:18
    @status: to be proved

    @type: obligation
    @id: 104
    @loc: 280:14:280:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 105
    @loc: 280:20:280:24
    @status: to be proved

    @type: obligation
    @id: 105
    @loc: 280:20:280:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 106
    @loc: 290:1:290:3
    @status: to be proved

    @type: obligation
    @id: 106
    @loc: 290:1:290:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 107
    @loc: 290:4:290:16
    @status: to be proved

    @type: obligation
    @id: 107
    @loc: 290:4:290:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 108
    @loc: 290:18:290:31
    @status: to be proved

    @type: obligation
    @id: 108
    @loc: 290:18:290:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 109
    @loc: 290:33:290:44
    @status: to be proved

    @type: obligation
    @id: 109
    @loc: 290:33:290:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 108

    File "./Allocator.tla", line 12, character 1 to line 307, character 73:
    [INFO]: All 108 obligations proved.
---*)
