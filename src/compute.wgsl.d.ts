declare module "compute.wgsl" {
  const data: {
  "bindGroups": [
    [
      {
        "name": "color",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105185,
              "line": 15,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105186,
              "line": 15,
              "name": "binding",
              "value": "0"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "write"
        },
        "group": 0,
        "binding": 0,
        "attributes": [
          {
            "id": 105185,
            "line": 15,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105186,
            "line": 15,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "prevColor",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105189,
              "line": 16,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105190,
              "line": 16,
              "name": "binding",
              "value": "1"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "read"
        },
        "group": 0,
        "binding": 1,
        "attributes": [
          {
            "id": 105189,
            "line": 16,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105190,
            "line": 16,
            "name": "binding",
            "value": "1"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "worldSpacePosition",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105193,
              "line": 17,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105194,
              "line": 17,
              "name": "binding",
              "value": "2"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "write"
        },
        "group": 0,
        "binding": 2,
        "attributes": [
          {
            "id": 105193,
            "line": 17,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105194,
            "line": 17,
            "name": "binding",
            "value": "2"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "prevWorldSpacePosition",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105197,
              "line": 18,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105198,
              "line": 18,
              "name": "binding",
              "value": "3"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "read"
        },
        "group": 0,
        "binding": 3,
        "attributes": [
          {
            "id": 105197,
            "line": 18,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105198,
            "line": 18,
            "name": "binding",
            "value": "3"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "accumulatedReprojectionError",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105201,
              "line": 19,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105202,
              "line": 19,
              "name": "binding",
              "value": "4"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "write"
        },
        "group": 0,
        "binding": 4,
        "attributes": [
          {
            "id": 105201,
            "line": 19,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105202,
            "line": 19,
            "name": "binding",
            "value": "4"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "prevAccumulatedReprojectionError",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 105205,
              "line": 20,
              "name": "group",
              "value": "0"
            },
            {
              "id": 105206,
              "line": 20,
              "name": "binding",
              "value": "5"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "read"
        },
        "group": 0,
        "binding": 5,
        "attributes": [
          {
            "id": 105205,
            "line": 20,
            "name": "group",
            "value": "0"
          },
          {
            "id": 105206,
            "line": 20,
            "name": "binding",
            "value": "5"
          }
        ],
        "resourceType": 4,
        "access": "read"
      }
    ],
    [
      {
        "name": "params",
        "type": {
          "name": "Params",
          "attributes": null,
          "size": 288,
          "members": [
            {
              "name": "size",
              "type": {
                "name": "vec2",
                "attributes": null,
                "size": 8,
                "format": {
                  "name": "u32",
                  "attributes": null,
                  "size": 4
                },
                "access": null
              },
              "attributes": null,
              "offset": 0,
              "size": 8
            },
            {
              "name": "rand",
              "type": {
                "name": "vec2f",
                "attributes": null,
                "size": 8
              },
              "attributes": null,
              "offset": 8,
              "size": 8
            },
            {
              "name": "transformInv",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 16,
              "size": 64
            },
            {
              "name": "transform",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 80,
              "size": 64
            },
            {
              "name": "lastTransformInverse",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 144,
              "size": 64
            },
            {
              "name": "lastTransform",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 208,
              "size": 64
            },
            {
              "name": "brightnessFactor",
              "type": {
                "name": "f32",
                "attributes": null,
                "size": 4
              },
              "attributes": null,
              "offset": 272,
              "size": 4
            }
          ],
          "align": 16,
          "startLine": 5,
          "endLine": 13,
          "inUse": true
        },
        "group": 1,
        "binding": 0,
        "attributes": [
          {
            "id": 105209,
            "line": 22,
            "name": "group",
            "value": "1"
          },
          {
            "id": 105210,
            "line": 22,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 0,
        "access": "read"
      },
      {
        "name": "smpl",
        "type": {
          "name": "sampler",
          "attributes": [
            {
              "id": 105212,
              "line": 23,
              "name": "group",
              "value": "1"
            },
            {
              "id": 105213,
              "line": 23,
              "name": "binding",
              "value": "1"
            }
          ],
          "size": 0,
          "format": null,
          "access": null
        },
        "group": 1,
        "binding": 1,
        "attributes": [
          {
            "id": 105212,
            "line": 23,
            "name": "group",
            "value": "1"
          },
          {
            "id": 105213,
            "line": 23,
            "name": "binding",
            "value": "1"
          }
        ],
        "resourceType": 3,
        "access": ""
      }
    ]
  ]
};
 export default data; 
}